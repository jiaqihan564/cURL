// 全局变量
let historyData = [];
const LOCAL_STORAGE_KEY = 'curl_history';

// DOM 元素
const curlInput = document.getElementById('curlInput');
const parseButton = document.getElementById('parseButton');
const clearButton = document.getElementById('clearButton');
const pasteButton = document.getElementById('pasteButton');
const responseContent = document.getElementById('responseContent');
const headersContent = document.getElementById('headersContent');
const parsedContent = document.getElementById('parsedContent');
const copyResponseButton = document.getElementById('copyResponseButton');
const copyHeadersButton = document.getElementById('copyHeadersButton');
const copyParsedButton = document.getElementById('copyParsedButton');
const historyList = document.getElementById('historyList');
const clearHistoryButton = document.getElementById('clearHistoryButton');
const exportHistoryButton = document.getElementById('exportHistoryButton');
const importHistoryButton = document.getElementById('importHistoryButton');
const importHistoryFile = document.getElementById('importHistoryFile');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');
const showExamplesButton = document.getElementById('showExamplesButton');
const examplesModal = document.getElementById('examplesModal');
const closeModalButton = document.querySelector('.close-modal');
const exampleItems = document.querySelectorAll('.example-item');
const loadingIndicator = document.getElementById('loadingIndicator');
const requestModeToggle = document.getElementById('requestModeToggle');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadHistoryFromLocalStorage();
    renderHistoryList();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 解析按钮点击事件
    parseButton.addEventListener('click', handleParseCurl);
    
    // 清空命令按钮点击事件
    clearButton.addEventListener('click', clearCurlInput);
    
    // 粘贴按钮点击事件
    pasteButton.addEventListener('click', handlePaste);
    
    // 复制响应内容按钮点击事件
    copyResponseButton.addEventListener('click', () => copyToClipboard(responseContent.textContent, '响应内容'));
    
    // 请求模式切换事件
    requestModeToggle.addEventListener('change', updateRequestModeLabel);
    // 初始化模式标签
    updateRequestModeLabel();
    
    // 复制请求头按钮点击事件
    copyHeadersButton.addEventListener('click', () => copyToClipboard(headersContent.textContent, '请求头信息'));
    
    // 复制解析后的请求按钮点击事件
    copyParsedButton.addEventListener('click', () => copyToClipboard(parsedContent.textContent, '解析后的请求信息'));
    
    // 清空历史按钮点击事件
    clearHistoryButton.addEventListener('click', clearHistory);
    
    // 导出历史按钮点击事件
    exportHistoryButton.addEventListener('click', exportHistory);
    
    // 导入历史按钮点击事件
    importHistoryButton.addEventListener('click', () => {
        importHistoryFile.click();
    });
    
    // 导入历史文件变更事件
    importHistoryFile.addEventListener('change', importHistory);
    
    // 标签切换事件
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // 显示示例按钮点击事件
    showExamplesButton.addEventListener('click', () => {
        examplesModal.style.display = 'block';
    });
    
    // 关闭示例弹窗事件
    closeModalButton.addEventListener('click', () => {
        examplesModal.style.display = 'none';
    });
    
    // 点击弹窗外部关闭弹窗
    window.addEventListener('click', (event) => {
        if (event.target === examplesModal) {
            examplesModal.style.display = 'none';
        }
    });
    
    // 示例项点击事件
    exampleItems.forEach(item => {
        item.addEventListener('click', () => {
            const command = item.getAttribute('data-command');
            curlInput.value = command;
            examplesModal.style.display = 'none';
        });
    });
}

// 切换标签
function switchTab(tabId) {
    // 移除所有标签的活动状态
    tabButtons.forEach(button => button.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    // 设置选中标签的活动状态
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// 处理解析 cURL 命令
async function handleParseCurl() {
    const curlCommand = curlInput.value.trim();
    
    if (!curlCommand) {
        showError('请输入 cURL 命令');
        return;
    }
    
    try {
        // 解析 cURL 命令
        const parsedRequest = parseCurlCommand(curlCommand);
        
        // 显示解析后的请求信息
        displayParsedRequest(parsedRequest);
        
        // 显示加载指示器
        showLoading();
        
        try {
            // 发送请求
            const response = await sendRequest(parsedRequest);
            
            // 显示响应结果
            displayResponse(response);
            
            // 保存到历史记录
            saveToHistory(curlCommand, parsedRequest, response);
            
            // 切换到响应标签
            switchTab('response');
        } finally {
            // 无论请求成功还是失败，都隐藏加载指示器
            hideLoading();
        }
    } catch (error) {
        hideLoading(); // 确保在解析错误时也隐藏加载指示器
        showError(`解析或发送请求失败: ${error.message}`);
    }
}

// 解析 cURL 命令
function parseCurlCommand(curlCommand) {
    // 基本结构
    const result = {
        method: 'GET',
        url: '',
        headers: {},
        body: null
    };
    
    // 移除开头的 'curl' 并分割命令
    let command = curlCommand.replace(/^\s*curl\s+/i, '');
    
    // 解析 URL（没有选项的简单情况）
    if (!command.startsWith('-') && !command.startsWith('"') && !command.startsWith('\'')) {
        const urlMatch = command.match(/^(\S+)/);
        if (urlMatch) {
            result.url = urlMatch[1];
            return result;
        }
    }
    
    // 解析更复杂的命令
    const parts = splitCommand(command);
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // 解析方法
        if (part === '-X' || part === '--request') {
            if (i + 1 < parts.length) {
                result.method = parts[++i];
            }
            continue;
        }
        
        // 解析头信息
        if (part === '-H' || part === '--header') {
            if (i + 1 < parts.length) {
                const header = parts[++i];
                const match = header.match(/^([^:]+)\s*:\s*(.+)$/);
                if (match) {
                    const [, name, value] = match;
                    result.headers[name.trim()] = value.trim();
                }
            }
            continue;
        }
        
        // 解析数据体
        if (part === '-d' || part === '--data' || part === '--data-binary') {
            if (i + 1 < parts.length) {
                result.body = parts[++i];
                // 如果没有明确指定方法，默认为 POST
                if (result.method === 'GET') {
                    result.method = 'POST';
                }
                // 如果没有明确指定 Content-Type，默认为 application/x-www-form-urlencoded
                if (!result.headers['Content-Type']) {
                    result.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
            }
            continue;
        }
        
        // 解析 JSON 数据
        if (part === '--json') {
            if (i + 1 < parts.length) {
                result.body = parts[++i];
                // 如果没有明确指定方法，默认为 POST
                if (result.method === 'GET') {
                    result.method = 'POST';
                }
                // 设置 Content-Type 为 application/json
                result.headers['Content-Type'] = 'application/json';
            }
            continue;
        }
        
        // 解析 URL（如果不是选项，则假定为 URL）
        if (!part.startsWith('-') && !result.url) {
            result.url = part;
        }
    }
    
    return result;
}

// 分割命令，处理引号
function splitCommand(command) {
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let escaped = false;
    
    for (let i = 0; i < command.length; i++) {
        const char = command[i];
        
        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }
        
        if (char === '\\') {
            escaped = true;
            continue;
        }
        
        if (inQuotes) {
            if (char === quoteChar) {
                inQuotes = false;
            } else {
                current += char;
            }
            continue;
        }
        
        if (char === '"' || char === '\'') {
            inQuotes = true;
            quoteChar = char;
            continue;
        }
        
        if (/\s/.test(char)) {
            if (current) {
                parts.push(current);
                current = '';
            }
            continue;
        }
        
        current += char;
    }
    
    if (current) {
        parts.push(current);
    }
    
    return parts;
}

// 发送请求并获取响应
async function sendRequest(parsedRequest) {
    try {
        const startTime = performance.now();
        let response, headers, responseBody, statusCode, statusText;
        
        // 检查是否使用实际请求模式
        const useRealRequest = requestModeToggle.checked;
        
        if (useRealRequest) {
            // 实际发送请求模式
            // 构建请求选项
            const options = {
                method: parsedRequest.method,
                headers: {
                    ...parsedRequest.headers,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
            };
            
            // 添加请求体（如果有）
            if (parsedRequest.body && ['POST', 'PUT', 'PATCH'].includes(parsedRequest.method.toUpperCase())) {
                const contentType = options.headers['Content-Type'];
                if (contentType && contentType.includes('application/json')) {
                    try {
                        // 尝试将请求体解析为JSON对象，然后重新字符串化，确保格式正确
                        options.body = JSON.stringify(JSON.parse(parsedRequest.body));
                    } catch (e) {
                        // 如果解析失败，说明不是有效的JSON，直接使用原始字符串
                        options.body = parsedRequest.body;
                        console.warn('请求体不是有效的JSON，但Content-Type为application/json:', parsedRequest.body);
                    }
                } else {
                    options.body = parsedRequest.body;
                }
            }
            
            // 实际发送请求到指定URL
            response = await fetch(parsedRequest.url, options);
            
            // 获取响应头
            headers = {};
            response.headers.forEach((value, name) => {
                headers[name] = value;
            });
            
            // 尝试解析响应体
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const jsonData = await response.json();
                responseBody = JSON.stringify(jsonData);
            } else {
                responseBody = await response.text();
            }
            
            statusCode = response.status;
            statusText = response.statusText;

        } else {
            // 模拟响应模式
            // 模拟网络延迟（500-1500ms）
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
            
            // 使用简单的响应格式
            statusCode = 200;
            statusText = 'OK';
            
            // 简化的响应体
            const mockResponseBody = {
                message: "pong"
            };
            
            // 创建模拟响应头
            headers = {
                'Content-Type': 'application/json; charset=utf-8',
                'X-Request-Id': generateRequestId(),
                'Date': new Date().toUTCString(),
                'Content-Length': JSON.stringify(mockResponseBody).length.toString(),
                'Connection': 'close'
            };
            
            responseBody = JSON.stringify(mockResponseBody);
        }
        
        // 计算请求耗时
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        // 构建响应对象
        return {
            status: statusCode,
            statusText: statusText,
            headers: headers,
            body: responseBody,
            duration: duration
        };
    } catch (error) {
        console.error('请求失败:', error);
        return {
            error: true,
            message: `请求失败: ${error.message}`,
            stack: error.stack,
            status: 0,
            statusText: 'Network Error'
        };
    }
}

// 显示解析后的请求信息
function displayParsedRequest(parsedRequest) {
    const formatted = JSON.stringify(parsedRequest, null, 2);
    parsedContent.textContent = formatted;
}

// 显示响应结果
function displayResponse(response) {
    if (response.error) {
        responseContent.textContent = `错误: ${response.message}\n\n${response.stack || ''}`;
        headersContent.textContent = '请求失败，无法获取头信息';
        return;
    }
    
    // 显示完整HTTP响应（状态行+头部+响应体）
    const statusLine = `HTTP/1.1 ${response.status} ${response.statusText}`;
    const headerLines = Object.entries(response.headers)
        .map(([name, value]) => `${name}: ${value}`)
        .join('\n');
    
    // 构建完整的HTTP响应格式
    let formattedBody = response.body || '';
    
    // 如果是JSON内容，尝试格式化
    if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
        try {
            formattedBody = JSON.stringify(JSON.parse(response.body), null, 2);
        } catch (e) {
            // 如果JSON解析失败，保持原样
            console.log('JSON格式化失败:', e);
        }
    }
    
    const fullResponse = `${statusLine}\n${headerLines}\n\n${formattedBody}`;
    responseContent.textContent = fullResponse;
    
    // 显示头信息（包括状态行和请求耗时）
    const headersText = `${statusLine}\n` +
                        `耗时: ${response.duration}ms\n\n` +
                        headerLines;
    
    headersContent.textContent = headersText;
}

// 保存到历史记录
function saveToHistory(curlCommand, parsedRequest, response) {
    const historyItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        curlCommand: curlCommand,
        parsedRequest: parsedRequest,
        response: response
    };
    
    historyData.unshift(historyItem); // 添加到历史记录开头
    saveHistoryToLocalStorage();
    renderHistoryList();
}

// 渲染历史记录列表
function renderHistoryList() {
    if (historyData.length === 0) {
        historyList.innerHTML = '<div class="empty-history">暂无历史记录</div>';
        return;
    }
    
    historyList.innerHTML = '';
    
    historyData.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.id = item.id;
        
        const date = new Date(item.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        historyItem.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-title">${item.parsedRequest.method} ${item.parsedRequest.url.substring(0, 30)}${item.parsedRequest.url.length > 30 ? '...' : ''}</div>
                <div class="history-item-date">${formattedDate}</div>
            </div>
            <div class="history-item-command">${item.curlCommand}</div>
        `;
        
        historyItem.addEventListener('click', () => loadHistoryItem(item));
        
        historyList.appendChild(historyItem);
    });
}

// 加载历史记录项
function loadHistoryItem(item) {
    curlInput.value = item.curlCommand;
    displayParsedRequest(item.parsedRequest);
    displayResponse(item.response);
    switchTab('response');
}

// 清空历史记录
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        historyData = [];
        saveHistoryToLocalStorage();
        renderHistoryList();
    }
}

// 导出历史记录
function exportHistory() {
    if (historyData.length === 0) {
        alert('没有历史记录可导出');
        return;
    }
    
    const dataStr = JSON.stringify(historyData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileName = `curl_history_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.style.display = 'none';
    
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
}

// 导入历史记录
function importHistory(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData)) {
                if (confirm(`确定要导入 ${importedData.length} 条历史记录吗？这将覆盖当前的历史记录。`)) {
                    historyData = importedData;
                    saveHistoryToLocalStorage();
                    renderHistoryList();
                    alert('历史记录导入成功');
                }
            } else {
                throw new Error('导入的数据格式不正确');
            }
        } catch (error) {
            alert(`导入失败: ${error.message}`);
        }
        
        // 重置文件输入，以便可以再次选择同一文件
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// 从本地存储加载历史记录
function loadHistoryFromLocalStorage() {
    try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            historyData = JSON.parse(storedData);
        }
    } catch (error) {
        console.error('加载历史记录失败:', error);
        historyData = [];
    }
}

// 保存历史记录到本地存储
function saveHistoryToLocalStorage() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(historyData));
    } catch (error) {
        console.error('保存历史记录失败:', error);
        showError('保存历史记录失败: ' + error.message);
    }
}

// 显示错误信息
function showError(message) {
    responseContent.textContent = `错误: ${message}`;
    headersContent.textContent = '';
    parsedContent.textContent = '';
    switchTab('response');
}

// 显示加载指示器
function showLoading() {
    loadingIndicator.style.display = 'flex';
    parseButton.disabled = true;
    clearButton.disabled = true;
    pasteButton.disabled = true;
    copyResponseButton.disabled = true;
    copyHeadersButton.disabled = true;
    copyParsedButton.disabled = true;
    requestModeToggle.disabled = true;
}

// 隐藏加载指示器
function hideLoading() {
    loadingIndicator.style.display = 'none';
    parseButton.disabled = false;
    clearButton.disabled = false;
    pasteButton.disabled = false;
    copyResponseButton.disabled = false;
    copyHeadersButton.disabled = false;
    copyParsedButton.disabled = false;
    requestModeToggle.disabled = false;
}

// 清空cURL命令输入框
function clearCurlInput() {
    curlInput.value = '';
    curlInput.focus();
}

// 生成请求ID
function generateRequestId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 更新请求模式标签
function updateRequestModeLabel() {
    const toggleLabel = document.querySelector('.toggle-label');
    if (requestModeToggle.checked) {
        toggleLabel.textContent = '实际发送请求';
    } else {
        toggleLabel.textContent = '使用模拟响应';
    }
}

// 复制内容到剪贴板
async function copyToClipboard(text, contentType) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification(`${contentType}已复制到剪贴板`);
    } catch (err) {
        console.error('复制失败:', err);
        showNotification('复制失败，请手动复制', 'error');
    }
}

// 处理粘贴操作
async function handlePaste() {
    try {
        const text = await navigator.clipboard.readText();
        curlInput.value = text;
        showNotification('内容已从剪贴板粘贴');
    } catch (err) {
        console.error('粘贴失败:', err);
        showNotification('粘贴失败，请手动粘贴', 'error');
    }
}

// 显示通知
function showNotification(message, type = 'success') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动关闭通知
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}