# LeetCode-Mentor
Chrome extension that gives AI-powered hints for LeetCode problems — without spoiling the solution.

# DO-IT-YOURSELF — LeetCode Mentor

> Think first. Peek never.

A Chrome extension that helps you get better at LeetCode — without spoiling the solution.

## The Philosophy

Most people get stuck and immediately look at the solution. That's why they never improve.

DO-IT-YOURSELF gives you a single sharp hint that points your thinking in the right direction — without revealing the algorithm, the data structure, or the code.

You still have to figure it out. That's the point.

## Features

- Automatically detects the LeetCode problem you are on
- Shows problem title and difficulty
- AI-powered hints that nudge your thinking — not spoil it
- Cooldown timer to stop you from hint-spamming
- Hint history grouped by problem
- Works even when you switch tabs

## How to Install

1. Clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer Mode** in the top right
4. Click **Load unpacked**
5. Select the `leetcode-mentor` folder

## Setup

1. Get a free API key from `console.groq.com`
2. Open `popup.js`
3. Replace `YOUR_KEY_HERE` with your Groq API key

## How to Use

1. Open any LeetCode problem
2. Click the extension icon in your toolbar
3. Click **Get Hint** when you are truly stuck
4. Think about the hint before clicking again

## Built With

- Chrome Extension Manifest V3
- Vanilla JavaScript
- Groq API — llama-3.1-8b-instant
- No frameworks. No dependencies.

## Project Structure
