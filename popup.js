document.addEventListener("DOMContentLoaded", function () {

    const titleEl = document.getElementById("problem-title")
    const diffEl = document.getElementById("problem-difficulty")
    const hintBtn = document.getElementById("hint-btn")
    const hintBtnText = document.getElementById("hint-btn-text")
    const hintOutput = document.getElementById("hint-output")
    const loading = document.getElementById("loading")
    const cooldownInput = document.getElementById("cooldown-input")
    const cooldownToggle = document.getElementById("cooldown-toggle")
    const historyList = document.getElementById("history-list")

    const GROQ_API_KEY = "YOUR_API_KEY_HERE"
    const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

    let countdownInterval = null

    chrome.storage.local.get(["currentProblem", "cooldownMinutes", "hintHistory", "cooldownEnd", "cooldownEnabled", "onLeetCode"], function (result) {

        const problem = result.currentProblem
        const savedCooldown = result.cooldownMinutes || 5
        const hintHistory = result.hintHistory || {}
        const cooldownEnd = result.cooldownEnd || 0
        const onLeetCode = result.onLeetCode || false

        let cooldownEnabled = result.cooldownEnabled !== undefined ? result.cooldownEnabled : true

        cooldownInput.value = savedCooldown

        cooldownInput.addEventListener("change", function () {
            chrome.storage.local.set({ cooldownMinutes: parseInt(cooldownInput.value) })
        })

        if (cooldownToggle) {
            if (cooldownEnabled) {
                cooldownToggle.textContent = "ON"
                cooldownToggle.classList.remove("off")
                cooldownToggle.classList.add("on")
            } else {
                cooldownToggle.textContent = "OFF"
                cooldownToggle.classList.remove("on")
                cooldownToggle.classList.add("off")
            }

            cooldownToggle.addEventListener("click", function () {
                cooldownEnabled = !cooldownEnabled
                chrome.storage.local.set({ cooldownEnabled: cooldownEnabled })

                if (cooldownEnabled) {
                    cooldownToggle.textContent = "ON"
                    cooldownToggle.classList.remove("off")
                    cooldownToggle.classList.add("on")
                } else {
                    cooldownToggle.textContent = "OFF"
                    cooldownToggle.classList.remove("on")
                    cooldownToggle.classList.add("off")
                    if (countdownInterval) clearInterval(countdownInterval)
                    hintBtn.disabled = false
                    hintBtnText.textContent = "Get Hint"
                }
            })
        }

        if (problem) {

            titleEl.textContent = problem.title
            diffEl.textContent = problem.difficulty

            if (!onLeetCode) {
                const indicator = document.createElement("p")
                indicator.style.color = "var(--muted)"
                indicator.style.fontSize = "10px"
                indicator.style.marginTop = "6px"
                indicator.textContent = "⚠ Last visited problem — open a LeetCode problem to update"
                titleEl.parentNode.appendChild(indicator)
            }

            if (problem.difficulty === "Easy") {
                diffEl.style.color = "#00b8a3"
            } else if (problem.difficulty === "Medium") {
                diffEl.style.color = "#ffc01e"
            } else {
                diffEl.style.color = "#ff375f"
            }

            const now = Date.now()
            if (cooldownEnabled && cooldownEnd && now < cooldownEnd) {
                startCountdown(cooldownEnd)
            }

            renderHistory(hintHistory, problem.title)

            hintBtn.addEventListener("click", async function () {

                const now = Date.now()
                const storedEnd = await getStorageValue("cooldownEnd") || 0
                const storedEnabled = await getStorageValue("cooldownEnabled")

                if (storedEnabled !== false && now < storedEnd) {
                    return
                }

                loading.style.display = "flex"
                hintOutput.classList.remove("visible")
                hintOutput.innerHTML = ""
                hintBtn.disabled = true

                try {
                    const response = await fetch(GROQ_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + GROQ_API_KEY
                        },
                        body: JSON.stringify({
                            model: "llama-3.1-8b-instant",
                            messages: [
                                {
                                    role: "system",
                                    content: `You are a strict coding mentor.
Rules:
- Give exactly ONE hint. No more.
- The hint must point directly at the core insight needed to solve this problem.
- Do NOT summarize the problem back.
- Do NOT talk about examples or constraints.
- Do NOT be vague or philosophical.
- Do NOT write code.
- Ask ONE sharp question that makes the user think about the right data structure or algorithm pattern.
- Maximum 2 sentences.`
                                },
                                {
                                    role: "user",
                                    content: `Problem: ${problem.title}\nDifficulty: ${problem.difficulty}\nCore task: ${problem.content.replace(/<[^>]*>/g, '').substring(0, 300)}`
                                }
                            ],
                            max_tokens: 150
                        })
                    })

                    const data = await response.json()
                    const hint = data.choices[0].message.content

                    loading.style.display = "none"
                    hintOutput.innerHTML = `<p class="hint-label">MENTOR SAYS</p><p>${hint}</p>`
                    hintOutput.classList.add("visible")

                    const cooldownMins = parseInt(cooldownInput.value) || 5
                    const endTime = cooldownEnabled ? Date.now() + cooldownMins * 60 * 1000 : 0

                    chrome.storage.local.get("hintHistory", function (res) {
                        const history = res.hintHistory || {}
                        const key = problem.title

                        if (!history[key]) {
                            history[key] = []
                        }

                        history[key].push({
                            hint: hint,
                            time: new Date().toLocaleTimeString()
                        })

                        chrome.storage.local.set({
                            hintHistory: history,
                            cooldownEnd: endTime
                        }, function () {
                            renderHistory(history, problem.title)
                            if (cooldownEnabled && endTime > 0) {
                                startCountdown(endTime)
                            } else {
                                hintBtn.disabled = false
                            }
                        })
                    })

                } catch (error) {
                    loading.style.display = "none"
                    hintOutput.innerHTML = `<p class="hint-label">ERROR</p><p>${error.message}</p>`
                    hintOutput.classList.add("visible")
                    hintBtn.disabled = false
                }

            })

        } else {
            titleEl.textContent = "No problem detected"
            diffEl.textContent = "Open a LeetCode problem first"
            hintBtn.disabled = true
        }

    })

    function startCountdown(endTime) {
        if (countdownInterval) clearInterval(countdownInterval)
        hintBtn.disabled = true

        countdownInterval = setInterval(function () {
            const remaining = endTime - Date.now()

            if (remaining <= 0) {
                clearInterval(countdownInterval)
                hintBtn.disabled = false
                hintBtnText.textContent = "Get Hint"
                return
            }

            const mins = Math.floor(remaining / 60000)
            const secs = Math.floor((remaining % 60000) / 1000)
            hintBtnText.textContent = `Wait ${mins}:${secs.toString().padStart(2, "0")}`

        }, 1000)
    }

    function renderHistory(history, currentTitle) {
        historyList.innerHTML = ""

        const keys = Object.keys(history)

        if (keys.length === 0) {
            historyList.innerHTML = `<p class="empty-history">No hints yet. Start grinding! 💪</p>`
            return
        }

        const sortedKeys = [currentTitle, ...keys.filter(k => k !== currentTitle)]

        sortedKeys.forEach(function (title) {
            if (!history[title]) return

            const group = document.createElement("div")

            const groupTitle = document.createElement("p")
            groupTitle.className = "history-group-title"
            groupTitle.textContent = title
            group.appendChild(groupTitle)

            history[title].forEach(function (entry) {
                const item = document.createElement("div")
                item.className = "history-item"
                item.innerHTML = `<p>${entry.hint}</p><p class="history-time">${entry.time}</p>`
                group.appendChild(item)
            })

            historyList.appendChild(group)
        })
    }

    function getStorageValue(key) {
        return new Promise(function (resolve) {
            chrome.storage.local.get(key, function (result) {
                resolve(result[key])
            })
        })
    }

})
