#!/usr/bin/env node
/**
 * EVA: Architectural SSOT Agent
 * Powered by Typhoon (Chat) + Qwen (Code) + Gemma (Fast)
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import 'dotenv/config';

const TYPHOON_URL = 'http://thaillm.or.th/api/typhoon/v1/chat/completions';
const OLLAMA_URL = 'http://localhost:11434/api/generate';

const LOGO = chalk.cyan.bold(`
   ______     __     ___
  / ____/  __/ /_   /   | 
 / __/ | |/_/ __/  / /| | 
/ /___ >  </ /_   / ___ | 
/_____/_/|_|\__/  /_/  |_| Agent v1.0
`);

console.log(LOGO);

async function callTyphoon(prompt) {
    const res = await fetch(TYPHOON_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'apikey': process.env.THAILLM_API_KEY 
        },
        body: JSON.stringify({
            model: "/model",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4
        })
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

async function callLocal(prompt, model = "qwen2.5-coder:14b") {
    const res = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            prompt,
            stream: false
        })
    });
    const data = await res.json();
    return data.response;
}

async function runCommand(cmd) {
    try {
        console.log(chalk.gray(`> Executing: ${cmd}`));
        const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
        return output;
    } catch (e) {
        return `Error: ${e.stderr || e.message}`;
    }
}

async function interactiveLoop() {
    const { mode } = await inquirer.prompt([{
        type: 'list',
        name: 'mode',
        message: 'Select EVA Intelligence Mode:',
        choices: [
            { name: 'Typhoon (Expert Chat & Logic)', value: 'typhoon' },
            { name: 'Qwen 14B (Heavy Codegen/SQL)', value: 'qwen' },
            { name: 'Gemma 4 (Fast Local)', value: 'gemma' }
        ]
    }]);

    console.log(chalk.green(`\nEVA is ready in ${mode.toUpperCase()} mode. (Type 'exit' to quit)\n`));

    while (true) {
        const { query } = await inquirer.prompt([{
            name: 'query',
            message: chalk.cyan('➜'),
            prefix: ''
        }]);

        if (query.toLowerCase() === 'exit') break;

        const spinner = ora('EVA is thinking...').start();
        
        try {
            let response;
            if (mode === 'typhoon') {
                response = await callTyphoon(query);
            } else if (mode === 'qwen') {
                response = await callLocal(query, "qwen2.5-coder:14b-instruct-q4_K_M");
            } else {
                response = await callLocal(query, "gemma4:e2b");
            }
            
            spinner.stop();
            console.log(`\n${chalk.white(response)}\n`);

            // Basic Tool Use Suggestion
            if (response.includes('```bash') || response.includes('```powershell')) {
                const cmd = response.match(/```(?:bash|powershell)\n([\s\S]*?)```/)?.[1];
                if (cmd) {
                    const { confirm } = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'confirm',
                        message: `EVA suggested a command. Execute it?`,
                        default: false
                    }]);
                    if (confirm) {
                        const out = await runCommand(cmd);
                        console.log(chalk.yellow(out));
                    }
                }
            }

        } catch (err) {
            spinner.fail(`Error: ${err.message}`);
        }
    }
}

interactiveLoop();
