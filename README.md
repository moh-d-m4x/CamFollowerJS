# CamFollowerJS (Enhanced)

> 🍴 **Fork Information:** This project is a modernized fork of the original [CamFollowerJS by jumpjack](https://github.com/jumpjack/CamFollowerJS).

**CamFollowerJS** is a web-based simulator and generator for cam/follower mechanisms used in automata. It allows users to design cam profiles visually or via JSON, simulate the movement in real-time, and export the results for manufacturing.

<img width="1294" height="934" alt="SS" src="https://github.com/user-attachments/assets/47daf0f0-f2b3-4dcc-be2d-98a9d5b1aa24" />

## 🚀 Key Features & Improvements

This fork represents a significant overhaul of the original codebase, introducing:

* **Modern UI/UX:** A completely redesigned interface featuring a responsive grid layout and collapsible panels.
* **Theme Support:** Built-in **Dark Mode** and Light Mode toggle.
* **Direct STL Export:** Generate 3D printable files (`.stl`) directly from the browser—no external converters required.
* **Interactive Controls:** Real-time sliders for polar zoom, cartesian offset, and follower offset.
* **Visual Analysis:** Real-time pressure angle calculation and smoothing algorithms.
* **Import/Export:** Support for JSON profiles and SVG import/export.

## 🛠️ How to Use

1.  **Load or Draw:** Start by loading a JSON/SVG profile or editing the parameters in the "JSON Data" panel.
2.  **Simulate:** Use the **Rotation Control** panel to Start, Stop, or manually rotate the cam to verify movement.
3.  **Analyze:** Check the "Analysis" panel to ensure the pressure angle remains within acceptable limits.
4.  **Export:**
    * **SVG:** For laser cutting or 2D profiling.
    * **STL:** Set your extrusion height and download the 3D model for printing.

## 📦 Installation / Running Locally

Since this is a static web application, no build process is required.

1.  Clone or download this repository.
2.  Open `index.html` in any modern web browser.
3.  Ensure `paper-full.js` and other dependencies are in the same folder.

You can try the latest version of the simulator here:
[**https://moh-d-m4x.github.io/CamFollowerJS/**](https://moh-d-m4x.github.io/CamFollowerJS/)

## 🔗 Credits & Theory

* **Original Author:** [Jumpjack](https://github.com/jumpjack)
* **Library Used:** [Paper.js](http://paperjs.org/) for vector graphics scripting.

For theory on cam mechanisms and automata, please refer to the [original repository documentation](https://github.com/jumpjack/CamFollowerJS/tree/main/documents).