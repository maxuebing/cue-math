# CueMath 🎱

> A minimalist, interactive H5 training tool designed to help pool players master the **Diamond System (Three-Cushion Billiards Formula)** through rapid mental math and real-time visual simulations.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

---

## 💡 What is this?

The **Diamond System** (颗星公式) is essential for three-cushion and pool players to calculate bank/kick shots. However, calculating it under match pressure requires muscle memory. 

**CueMath** bridges the gap between theory and execution. It gamifies the mental math process, allowing players to practice cue-ball track calculations anytime, anywhere on their phones or browsers.

---

## 🚀 Key Features

* **📊 Progressive Difficulty Modes**:
  * *Rookie*: Fixed cue ball position (e.g., 50). Great for beginners to practice basic subtraction.
  * *Pro*: Fully randomized cue ball and object ball positions for advanced practice.
  * *Master*: Introduces special correction logic (e.g., short rail departures).
  * *Speed Run*: Time-attack mode to build instant muscle memory under a 60-second countdown.

* **🎯 Interactive Rail Selection**: 
  Instead of boring multiple-choice text, users can directly tap the diamonds/rails on the 2D pool table UI to choose their target, simulating real-life match experience.

* **⚡ Trajectory Simulation Feedback**: 
  * **On Success**: Watch the ball cleanly path through 3 cushions and hit the target with satisfying sound effects.
  * **On Failure**: The ball paths exactly where your wrong calculation would lead, followed by a **red dashed line** showing the error and a **green solid guideline ghost path** showing the correct calculation formula.

* **🧠 UX Enhancements**:
  * **Blind Mode**: Hide the numbers on the rails, forcing advanced players to memorize the table's diamonds.
  * **Stats & Weakness Tracking**: Analyzes the player's most frequent calculation errors.

---

## 🛠️ Tech Stack & Architecture

* **Frontend Framework**: Vue 3 / React (for UI, state management, and scoreboards)
* **Graphics & Animation**: PixiJS (for 2D table rendering and ball animations)
* **Trajectory Engine**: **Geometry-based Pseudo-physics**
  * Avoids real physics engines to prevent high tuning costs for friction and restitution.
  * Uses pre-calculated coordinate mapping and Tween animations to guarantee smooth and 100% accurate paths.

---

## 📦 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation
1. Clone the repository:
   ```bash
   git clone git@github.com:maxuebing/cue-math.git
   ```
2. Navigate to the project directory:
   ```bash
   cd cue-math
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📄 Design Specification

For detailed requirements, state machine design, and phase planning, please refer to the [Design Specification](docs/DESIGN_SPEC.md) (in Chinese).
