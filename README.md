# Day-1 Readiness Desk

A six-scene presenter-led visual demo for AAOT Module 5. Use it between the Module 5 slides and the instructor's actual Part 1 and Part 2 walkthroughs. The screens use synthetic teaching fixtures and bundled artwork from the November 23 handoff.

## Run locally

From this folder, run `python3 -m http.server 8000 --bind 127.0.0.1` and visit `http://127.0.0.1:8000/`. The demo uses plain HTML, CSS and JavaScript and ships with all twelve PNGs. There are no package installs, remote fonts or API calls.

## Present

Use **Previous** and **Next** in the header to move through the six scenes. Each scene shows the full diagram on arrival. Scene 6 displays the fresh-chat start and the five source filenames. Switch to the real demo manually.

All six final compositions can also be read with JavaScript disabled. The module uses the prepared reference `cfg_v002` as a classroom reference candidate. Independent file comparison is required before identifying it as the accepted output of a live Part 1 exercise.

## Hosting

This folder is the GitHub Pages publishing root. The site uses relative asset URLs, so it can be served under the GitHub project path or from a local directory.
