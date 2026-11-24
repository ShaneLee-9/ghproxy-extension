import { getSavedProxyUrl, saveProxyUrl } from '../shared/proxy-url.js';

const form = document.getElementById('proxy-form');
const input = document.getElementById('proxy-url');
const saveButton = document.getElementById('save-button');
const savedUrl = document.getElementById('saved-url');
const message = document.getElementById('message');

function showSavedUrl(value) {
  if (value) {
    savedUrl.textContent = value;
    savedUrl.classList.remove('empty');
  } else {
    savedUrl.textContent = '尚未设置代理地址';
    savedUrl.classList.add('empty');
  }
}

function showMessage(text, kind) {
  message.textContent = text;
  message.dataset.kind = kind || 'success';
}

async function loadSavedUrl() {
  try {
    const value = await getSavedProxyUrl();
    input.value = value;
    showSavedUrl(value);
  } catch (error) {
    showMessage('读取代理地址失败，请重新打开弹窗。', 'error');
    console.error('[Popup] 读取代理地址失败:', error);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  saveButton.disabled = true;
  message.textContent = '';

  try {
    const value = await saveProxyUrl(input.value);
    input.value = value;
    showSavedUrl(value);
    showMessage('代理地址已保存。');
  } catch (error) {
    showMessage(error.message || '保存失败，请检查代理地址。', 'error');
    input.focus();
  } finally {
    saveButton.disabled = false;
  }
});

loadSavedUrl();
