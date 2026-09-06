//! ttfx-node: headless frame rendering for JS (chalk-style library use).
//!
//! Only public ttfx API is used: effect configs come from parsing CLI args
//! (`Cli::try_parse_from`), so every one of the 37 effects' options — current
//! and future — works with CLI-identical validation and defaults, and no
//! per-effect mapping exists to rot. Frames are collected like
//! `dump_effect`, but in memory: no TTY, no signals, virtual clock.

use napi::bindgen_prelude::*;
use napi_derive::napi;

use clap::{CommandFactory, Parser};

/// Options for [`get_frames`]. Everything optional; effect-specific knobs
/// travel in `effect_args` as CLI flags (e.g. `["--typing-speed", "5"]`).
#[napi(object)]
pub struct FramesOptions {
    pub seed: Option<u32>,
    pub frame_rate: Option<u32>,
    pub canvas_width: Option<u32>,
    pub canvas_height: Option<u32>,
    pub tab_width: Option<u32>,
    pub wrap_text: Option<bool>,
    pub no_color: Option<bool>,
    pub xterm_colors: Option<bool>,
    pub max_frames: Option<u32>,
    pub random_effect: Option<bool>,
    pub include_effects: Option<Vec<String>>,
    pub exclude_effects: Option<Vec<String>>,
    pub effect_args: Option<Vec<String>>,
}

const MAX_FRAMES_DEFAULT: u64 = 10_000;
const MAX_FRAMES_HARD: u64 = 100_000;
const MAX_INPUT_BYTES: usize = 500_000;
const MAX_INPUT_LINES: usize = 5_000;
const MAX_LINE_CHARS: usize = 2_000;
const MAX_CANVAS_DIM: u32 = 1_000;
const MAX_TAB_WIDTH: u32 = 64;

fn err(msg: impl Into<String>) -> Error {
    Error::from_reason(msg.into())
}

/// Names of all 37 effects, in registry order.
#[napi]
pub fn list_effects() -> Vec<String> {
    ttfx::cli::Cli::command()
        .get_subcommands()
        .map(|c| c.get_name().to_string())
        .collect()
}

/// Render an effect headlessly: every frame as an ANSI string, top row first.
///
/// Deterministic for a given seed (virtual clock — wall time never consulted).
/// The canvas is input-sized unless `canvas_width`/`canvas_height` fix it;
/// terminal dimensions are never read, so output is machine-independent.
#[napi]
pub fn get_frames(input: String, effect: String, options: Option<FramesOptions>) -> Result<Vec<String>> {
    let opts = options.unwrap_or(FramesOptions {
        seed: None,
        frame_rate: None,
        canvas_width: None,
        canvas_height: None,
        tab_width: None,
        wrap_text: None,
        no_color: None,
        xterm_colors: None,
        max_frames: None,
        random_effect: None,
        include_effects: None,
        exclude_effects: None,
        effect_args: None,
    });

    if input.trim().is_empty() {
        return Err(err("NO INPUT."));
    }
    if input.len() > MAX_INPUT_BYTES {
        return Err(err(format!("input exceeds {MAX_INPUT_BYTES} bytes")));
    }
    let mut lines = 0usize;
    for line in input.split('\n') {
        lines += 1;
        if lines > MAX_INPUT_LINES {
            return Err(err(format!("input exceeds {MAX_INPUT_LINES} lines")));
        }
        if line.chars().count() > MAX_LINE_CHARS {
            return Err(err(format!("input line exceeds {MAX_LINE_CHARS} characters")));
        }
    }

    let max_frames = opts.max_frames.unwrap_or(MAX_FRAMES_DEFAULT as u32) as u64;
    if max_frames == 0 || max_frames > MAX_FRAMES_HARD {
        return Err(err(format!("max_frames must be 1..={MAX_FRAMES_HARD}")));
    }
    for (label, dim) in [("canvas_width", opts.canvas_width), ("canvas_height", opts.canvas_height)] {
        if dim.is_some_and(|d| d == 0 || d > MAX_CANVAS_DIM) {
            return Err(err(format!("{label} must be 1..={MAX_CANVAS_DIM}")));
        }
    }
    if opts.tab_width.is_some_and(|t| t == 0 || t > MAX_TAB_WIDTH) {
        return Err(err(format!("tab_width must be 1..={MAX_TAB_WIDTH}")));
    }

    // Translate typed options into CLI args: one parse path for validation,
    // defaults, colors, anchors — identical to the binary.
    let mut argv: Vec<String> = vec!["ttfx".to_string()];
    let mut push_opt = |flag: &str, v: Option<u32>| {
        if let Some(n) = v {
            argv.push(flag.to_string());
            argv.push(n.to_string());
        }
    };
    push_opt("--frame-rate", opts.frame_rate);
    push_opt("--canvas-width", opts.canvas_width);
    push_opt("--canvas-height", opts.canvas_height);
    push_opt("--tab-width", opts.tab_width);
    if let Some(seed) = opts.seed {
        argv.push("--seed".to_string());
        argv.push(seed.to_string());
    }
    for (flag, on) in [
        ("--wrap-text", opts.wrap_text),
        ("--no-color", opts.no_color),
        ("--xterm-colors", opts.xterm_colors),
    ] {
        if on == Some(true) {
            argv.push(flag.to_string());
        }
    }
    // Library purity: never consult the host terminal size; the canvas is a
    // pure function of the input (and explicit dimensions).
    argv.push("--ignore-terminal-dimensions".to_string());
    if opts.random_effect == Some(true) {
        argv.push("--random-effect".to_string());
        for name in opts.include_effects.unwrap_or_default() {
            argv.push("--include-effects".to_string());
            argv.push(name);
        }
        for name in opts.exclude_effects.unwrap_or_default() {
            argv.push("--exclude-effects".to_string());
            argv.push(name);
        }
    } else {
        if effect.trim().is_empty() {
            return Err(err("no effect specified"));
        }
        argv.push(effect);
        argv.extend(opts.effect_args.unwrap_or_default());
    }

    let cli = ttfx::cli::Cli::try_parse_from(argv).map_err(|e| err(e.to_string()))?;
    let mut rng = match cli.seed {
        Some(seed) => ttfx::utils::rng::Rng::seeded(seed),
        None => ttfx::utils::rng::Rng::from_entropy(),
    };
    let config = cli.terminal_config();

    // Borrow-then-move: config is built first, then the effect is moved out.
    // `cli` is not used afterwards.
    let effect_command = if cli.random_effect {
        let mut names: Vec<String> = ttfx::cli::Cli::command()
            .get_subcommands()
            .map(|c| c.get_name().to_string())
            .collect();
        if !cli.include_effects.is_empty() {
            names.retain(|n| cli.include_effects.contains(n));
        }
        names.retain(|n| !cli.exclude_effects.contains(n));
        if names.is_empty() {
            return Err(err("no effects available after filtering"));
        }
        let name = names[rng.choice_index(names.len())].clone();
        match ttfx::cli::Cli::try_parse_from(["ttfx", &name]) {
            Ok(ttfx::cli::Cli { effect: Some(effect), .. }) => effect,
            _ => return Err(err(format!("failed to build effect '{name}'"))),
        }
    } else {
        match cli.effect {
            Some(effect) => effect,
            None => return Err(err("no effect specified")),
        }
    };
    let clock = ttfx::engine::ctx::Clock::virtual_with_frame_rate(config.frame_rate);
    let mut ctx = ttfx::engine::ctx::EngineCtx::new(&input, config, rng, clock)
        .map_err(|e| err(e.to_string()))?;
    let mut effect = effect_command.build_effect();
    effect.build(&mut ctx).map_err(|e| err(e.to_string()))?;

    let mut frames: Vec<String> = Vec::new();
    while let Some(frame) = effect.next_frame(&mut ctx) {
        frames.push(frame);
        if frames.len() as u64 >= max_frames {
            break;
        }
    }
    Ok(frames)
}
