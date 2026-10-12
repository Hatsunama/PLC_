# PLC Workshop

A self-contained PLC technician foundation course. Lessons, simulations, questions, and feedback all run in the browser. Learners do not need to install PLC software or connect any equipment.

## Included

- 12 lessons covering PLC signals, ladder logic, motor requests, timers, counters, sequences, analog scaling, HMI alarms, networks, troubleshooting, and a final filling-station project.
- 12 interactive practice tasks with checks for the required behavior.
- 36 questions presented one at a time, with correct/incorrect feedback, progressive hints, and retry opportunities.
- No answer-key screen or reveal-answer button.
- Progress saved in the current browser with localStorage.
- Responsive layouts and keyboard-accessible controls.

## Run or host the course

The site is static and has no build step or runtime dependencies. Publish the contents of `dist/` using any static web host. Keep all six files together and serve them over HTTP or HTTPS so JavaScript modules load correctly.

For a local developer preview, run a static file server from the repository root, for example:

```sh
python3 -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`. Python is only one optional preview tool; learners use the hosted course directly.

## Validate

With a current Node.js installation:

```sh
npm test
```

No dependency installation is required. The tests cover every practice completion path, question structure, timer resets, counter edges, fault handling, network configuration recovery, and capstone interruption/restart behavior. Browser layout and interaction testing are separate from these logic tests.

## File map

| File | Purpose |
| --- | --- |
| `dist/index.html` | Course entry point |
| `dist/style.css` | Responsive course and practice-bench styling |
| `dist/course.js` | Lessons, question definitions, and progressive hints |
| `dist/engine.js` | Simulation rules and practice validation |
| `dist/labs.js` | Interactive practice-bench markup |
| `dist/app.js` | Navigation, question feedback, and saved progress |
| `test.mjs` | Automated simulation and content checks |

## Model and storage limits

The exercises are educational models, not vendor PLC emulators or safety controllers. They never connect to industrial equipment. The network lab is a fictional model, not an actual network connection. Real equipment work requires site authorization, manufacturer instructions, and supervised practical training.

Feedback uses predefined checks and hints, not an open-ended AI grading service. Assessment logic is client-side and readable in the source; it is intended for self-directed learning rather than secure examinations.

Progress belongs to the browser and device where the course is used. It does not sync across devices or site origins. Clearing browser data may remove it. Optional technical references are available in the course notes; no external content is required to complete the lessons.
