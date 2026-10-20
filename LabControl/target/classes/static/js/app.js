/**
 * LabControl - Gerenciador Web de Equipamentos
 * Suporta modo duplo: API Spring Boot REST ou Armazenamento Local Interativo
 */

const API_BASE = window.location.protocol.startsWith('http') && window.location.port === '8080'
  ? '/equipamentos'
  : 'http://localhost:8080/equipamentos';

// Dados iniciais para demonstração e uso imediato na Web
const INITIAL_DEMO_DATA = [
  {
    id: 1,
    nome: "Microscópio Óptico Binocular 1000x",
    numeroPatrimonio: "PAT-00101",
    categoria: "Óptica",
    quantidade: 5
  },
  {
    id: 2,
    nome: "Espectrofotômetro UV-Vis Dual Beam",
    numeroPatrimonio: "PAT-00102",
    categoria: "Espectrometria",
    quantidade: 2
  },
  {
    id: 3,
    nome: "Centrífuga Refrigerada de Alta Velocidade",
    numeroPatrimonio: "PAT-00103",
    categoria: "Centrifugação",
    quantidade: 3
  },
  {
    id: 4,
    nome: "Balança Analítica de Precisão 0.0001g",
    numeroPatrimonio: "PAT-00104",
    categoria: "Pesagem",
    quantidade: 8
  },
  {
    id: 5,
    nome: "Autoclave Vertical Digital 75L",
    numeroPatrimonio: "PAT-00105",
    categoria: "Esterilização",
    quantidade: 0
  },
  {
    id: 6,
    nome: "pHmetro Digital de Bancada com Eletrodo",
    numeroPatrimonio: "PAT-00106",
    categoria: "Eletroquímica",
    quantidade: 4
  }
];

// Estado
let isLocalMode = false;
let allEquipamentos = [];
let activeFilterSearch = '';
let activeFilterCategory = '';

// Elementos do DOM
const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('filter-search');
const categorySelect = document.getElementById('filter-category');
const btnReload = document.getElementById('btn-reload');

// Contadores
const statTotalItems = document.getElementById('stat-total-items');
const statTotalStock = document.getElementById('stat-total-stock');
const statCategories = document.getElementById('stat-categories');
const statLowStock = document.getElementById('stat-low-stock');

// Formulário Principal
const equipmentForm = document.getElementById('inline-equipment-form');
const formCardTitle = document.getElementById('form-card-title');
const formCardSubtitle = document.getElementById('form-card-subtitle');
const formIcon = document.getElementById('form-icon');
const btnFormSubmit = document.getElementById('btn-form-submit');
const btnFormText = document.getElementById('btn-form-text');
const btnFormCancel = document.getElementById('btn-form-cancel');

// Inputs do Formulário
const formId = document.getElementById('form-id');
const formNome = document.getElementById('form-nome');
const formPatrimonio = document.getElementById('form-patrimonio');
const formCategoria = document.getElementById('form-categoria');
const formQuantidade = document.getElementById('form-quantidade');
const nomeCharCount = document.getElementById('nome-char-count');
const btnQtyMinus = document.getElementById('btn-qty-minus');
const btnQtyPlus = document.getElementById('btn-qty-plus');

// Erros
const errorNome = document.getElementById('error-nome');
const errorPatrimonio = document.getElementById('error-patrimonio');
const errorCategoria = document.getElementById('error-categoria');
const errorQuantidade = document.getElementById('error-quantidade');

// Modal JSON
const jsonModal = document.getElementById('json-modal');
const jsonModalContent = document.getElementById('json-modal-content');
const btnCloseJsonModal = document.getElementById('btn-close-json-modal');
const btnDismissJson = document.getElementById('btn-dismiss-json');
const btnCopyJson = document.getElementById('btn-copy-json');

// Toasts
const toastContainer = document.getElementById('toast-container');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadEquipamentos();
});

function setupEventListeners() {
  equipmentForm.addEventListener('submit', handleFormSubmit);
  btnFormCancel.addEventListener('click', resetFormToCreateMode);

  // Contador de caracteres do nome
  formNome.addEventListener('input', (e) => {
    const len = e.target.value.length;
    nomeCharCount.textContent = `${len}/100`;
    if (len > 100) {
      nomeCharCount.style.color = '#ef4444';
    } else {
      nomeCharCount.style.color = '#64748b';
    }
  });

  // Botões do stepper de quantidade (+ e -)
  btnQtyMinus.addEventListener('click', () => {
    let val = parseInt(formQuantidade.value, 10) || 0;
    if (val > 0) formQuantidade.value = val - 1;
  });

  btnQtyPlus.addEventListener('click', () => {
    let val = parseInt(formQuantidade.value, 10) || 0;
    formQuantidade.value = val + 1;
  });

  // Busca e Filtros
  searchInput.addEventListener('input', (e) => {
    activeFilterSearch = e.target.value.toLowerCase().trim();
    renderTable();
  });

  categorySelect.addEventListener('change', (e) => {
    activeFilterCategory = e.target.value;
    renderTable();
  });

  btnReload.addEventListener('click', () => {
    loadEquipamentos();
    showToast('Atualizando dados...', 'info');
  });

  // Modal JSON
  btnCloseJsonModal.addEventListener('click', () => jsonModal.classList.remove('active'));
  btnDismissJson.addEventListener('click', () => jsonModal.classList.remove('active'));
  btnCopyJson.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonModalContent.textContent)
      .then(() => showToast('JSON copiado para a área de transferência!', 'success'))
      .catch(() => showToast('Erro ao copiar JSON.', 'error'));
  });

  window.addEventListener('click', (e) => {
    if (e.target === jsonModal) jsonModal.classList.remove('active');
  });
}

/**
 * Carregar lista de equipamentos
 */
async function loadEquipamentos() {
  tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="loading-state">
        <div class="spinner"></div>
        <span>Consultando inventário...</span>
      </td>
    </tr>
  `;

  if (window.location.protocol === 'file:') {
    isLocalMode = true;
    allEquipamentos = getLocalEquipamentos();
    updateModeIndicator();
    updateCategoryDropdown();
    updateStats();
    renderTable();
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(API_BASE, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      isLocalMode = false;
      allEquipamentos = await res.json();
    } else {
      throw new Error(`Status ${res.status}`);
    }
  } catch (err) {
    isLocalMode = true;
    allEquipamentos = getLocalEquipamentos();
  }

  updateModeIndicator();
  updateCategoryDropdown();
  updateStats();
  renderTable();
}

/**
 * Indicador de Modo (Online/Local)
 */
function updateModeIndicator() {
  const tag = document.getElementById('connection-status-tag');
  if (!tag) return;

  if (isLocalMode) {
    tag.style.background = 'rgba(245, 158, 11, 0.2)';
    tag.style.color = '#fbbf24';
    tag.style.border = '1px solid rgba(245, 158, 11, 0.4)';
    tag.textContent = 'Modo Web Direto (Armazenamento Local)';
  } else {
    tag.style.background = 'rgba(16, 185, 129, 0.2)';
    tag.style.color = '#34d399';
    tag.style.border = '1px solid rgba(16, 185, 129, 0.4)';
    tag.textContent = 'Conectado à API Spring Boot (MySQL)';
  }
}

/**
 * Armazenamento Local
 */
function getLocalEquipamentos() {
  const saved = localStorage.getItem('labcontrol_equipamentos');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  localStorage.setItem('labcontrol_equipamentos', JSON.stringify(INITIAL_DEMO_DATA));
  return [...INITIAL_DEMO_DATA];
}

function saveLocalEquipamentos(list) {
  allEquipamentos = list;
  localStorage.setItem('labcontrol_equipamentos', JSON.stringify(list));
}

/**
 * Atualizar Contadores de Métricas
 */
function updateStats() {
  const totalItems = allEquipamentos.length;
  const totalStock = allEquipamentos.reduce((acc, curr) => acc + (Number(curr.quantidade) || 0), 0);
  const categories = new Set(allEquipamentos.map(e => e.categoria).filter(Boolean));
  const lowStock = allEquipamentos.filter(e => Number(e.quantidade) === 0).length;

  statTotalItems.textContent = totalItems;
  statTotalStock.textContent = totalStock;
  statCategories.textContent = categories.size;
  statLowStock.textContent = lowStock;
}

/**
 * Atualizar Categorias no Dropdown
 */
function updateCategoryDropdown() {
  const categories = Array.from(new Set(allEquipamentos.map(e => e.categoria).filter(Boolean))).sort();
  const currentVal = categorySelect.value;

  categorySelect.innerHTML = '<option value="">Todas as Categorias</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  if (categories.includes(currentVal)) {
    categorySelect.value = currentVal;
  }
}

/**
 * Renderizar Tabela de Equipamentos
 */
function renderTable() {
  const filtered = allEquipamentos.filter(item => {
    const matchSearch = !activeFilterSearch ||
      (item.nome && item.nome.toLowerCase().includes(activeFilterSearch)) ||
      (item.numeroPatrimonio && item.numeroPatrimonio.toLowerCase().includes(activeFilterSearch)) ||
      (item.categoria && item.categoria.toLowerCase().includes(activeFilterSearch));

    const matchCategory = !activeFilterCategory || item.categoria === activeFilterCategory;
    return matchSearch && matchCategory;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <p style="margin-bottom: 6px; font-weight: 600;">Nenhum equipamento encontrado</p>
          <span style="font-size: 12px; color: #64748b;">Cadastre um novo item no painel à esquerda ou limpe a busca.</span>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(item => {
    const isOut = Number(item.quantidade) === 0;
    const statusPill = isOut 
      ? `<span class="status-pill status-pill-out">Esgotado</span>`
      : `<span class="status-pill status-pill-available">Disponível</span>`;

    return `
      <tr>
        <td style="color: #64748b; font-family: monospace;">#${item.id}</td>
        <td>
          <div style="font-weight: 600; color: #f8fafc;">${escapeHtml(item.nome)}</div>
        </td>
        <td>
          <span class="patrimonio-badge">${escapeHtml(item.numeroPatrimonio)}</span>
        </td>
        <td>
          <span style="color: #94a3b8;">${escapeHtml(item.categoria)}</span>
        </td>
        <td class="text-center" style="font-weight: 700; ${isOut ? 'color: #ef4444;' : 'color: #38bdf8;'}">
          ${item.quantidade}
        </td>
        <td class="text-center">
          ${statusPill}
        </td>
        <td class="text-center">
          <div class="action-btn-group">
            <button class="btn-action btn-action-edit" title="Editar equipamento" onclick="loadItemIntoForm(${item.id})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Editar
            </button>
            <button class="btn-action btn-action-delete" title="Excluir equipamento" onclick="deleteEquipamento(${item.id}, '${escapeJs(item.nome)}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Remover
            </button>
            <button class="btn-action" title="Ver JSON" onclick="viewJsonDetails(${item.id})">
              JSON
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Carregar item no formulário para edição
 */
function loadItemIntoForm(id) {
  const item = allEquipamentos.find(e => e.id === id);
  if (!item) return;

  clearFormErrors();
  formId.value = item.id;
  formNome.value = item.nome;
  formPatrimonio.value = item.numeroPatrimonio;
  formCategoria.value = item.categoria;
  formQuantidade.value = item.quantidade;
  nomeCharCount.textContent = `${item.nome.length}/100`;

  // Atualizar cabeçalho do card de formulário
  formIcon.textContent = '✏️';
  formCardTitle.textContent = `Editar Equipamento #${item.id}`;
  formCardSubtitle.textContent = 'Modifique os dados abaixo e clique em Salvar Alterações.';
  btnFormText.textContent = '💾 Salvar Alterações';
  btnFormCancel.style.display = 'inline-block';

  // Rolar até o formulário suavemente
  document.getElementById('gerenciamento').scrollIntoView({ behavior: 'smooth' });
  formNome.focus();
}

/**
 * Resetar formulário para modo de criação
 */
function resetFormToCreateMode() {
  clearFormErrors();
  equipmentForm.reset();
  formId.value = '';
  formQuantidade.value = '1';
  nomeCharCount.textContent = '0/100';

  formIcon.textContent = '➕';
  formCardTitle.textContent = 'Adicionar Equipamento';
  formCardSubtitle.textContent = 'Preencha os campos para cadastrar no inventário.';
  btnFormText.textContent = '➕ Cadastrar Equipamento';
  btnFormCancel.style.display = 'none';
}

function clearFormErrors() {
  errorNome.textContent = '';
  errorPatrimonio.textContent = '';
  errorCategoria.textContent = '';
  errorQuantidade.textContent = '';
}

/**
 * Submeter formulário (Criar ou Atualizar)
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  clearFormErrors();

  const id = formId.value ? Number(formId.value) : null;
  const isEditing = Boolean(id);

  const payload = {
    nome: formNome.value.trim(),
    numeroPatrimonio: formPatrimonio.value.trim(),
    categoria: formCategoria.value.trim(),
    quantidade: parseInt(formQuantidade.value, 10)
  };

  // Validação Bean Validation (Nome de 3 a 100 caracteres)
  let hasError = false;
  if (!payload.nome || payload.nome.length < 3 || payload.nome.length > 100) {
    errorNome.textContent = 'O nome deve ter entre 3 e 100 caracteres.';
    hasError = true;
  }
  if (!payload.numeroPatrimonio) {
    errorPatrimonio.textContent = 'O número de patrimônio é obrigatório.';
    hasError = true;
  }
  if (!payload.categoria) {
    errorCategoria.textContent = 'A categoria é obrigatória.';
    hasError = true;
  }
  if (isNaN(payload.quantidade) || payload.quantidade < 0) {
    errorQuantidade.textContent = 'A quantidade deve ser maior ou igual a 0.';
    hasError = true;
  }

  if (hasError) {
    showToast('Campos inválidos! Verifique as mensagens de erro.', 'error');
    return;
  }

  // Execução no modo Local
  if (isLocalMode) {
    // Validação de unicidade de patrimônio
    const patrimonioDuplicado = allEquipamentos.some(item => {
      if (isEditing && item.id === id) return false;
      return item.numeroPatrimonio.toLowerCase() === payload.numeroPatrimonio.toLowerCase();
    });

    if (patrimonioDuplicado) {
      errorPatrimonio.textContent = `Já existe outro equipamento cadastrado com o número de patrimônio: ${payload.numeroPatrimonio}`;
      showToast(`Conflito (HTTP 409): O patrimônio "${payload.numeroPatrimonio}" já pertence a outro item!`, 'error');
      return;
    }

    if (isEditing) {
      const idx = allEquipamentos.findIndex(e => e.id === id);
      if (idx !== -1) {
        allEquipamentos[idx] = { id, ...payload };
        saveLocalEquipamentos(allEquipamentos);
        showToast(`Equipamento #${id} atualizado com sucesso! (HTTP 200 OK)`, 'success');
      }
    } else {
      const newId = allEquipamentos.length > 0 ? Math.max(...allEquipamentos.map(e => e.id)) + 1 : 1;
      const novo = { id: newId, ...payload };
      allEquipamentos.push(novo);
      saveLocalEquipamentos(allEquipamentos);
      showToast(`Equipamento cadastrado com sucesso! (HTTP 201 Created)`, 'success');
    }

    resetFormToCreateMode();
    updateCategoryDropdown();
    updateStats();
    renderTable();
    return;
  }

  // Execução via API Spring Boot REST
  const url = isEditing ? `${API_BASE}/${id}` : API_BASE;
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);

    if (res.status === 201 || res.status === 200) {
      showToast(isEditing ? 'Equipamento atualizado com sucesso!' : 'Equipamento cadastrado com sucesso! (HTTP 201)', 'success');
      resetFormToCreateMode();
      await loadEquipamentos();
    } else if (res.status === 409) {
      errorPatrimonio.textContent = (data && data.message) || 'Número de patrimônio já cadastrado em outro equipamento.';
      showToast('Conflito (HTTP 409): ' + ((data && data.message) || 'Patrimônio já cadastrado'), 'error');
    } else if (res.status === 400) {
      if (data && data.fieldErrors) {
        if (data.fieldErrors.nome) errorNome.textContent = data.fieldErrors.nome;
        if (data.fieldErrors.numeroPatrimonio) errorPatrimonio.textContent = data.fieldErrors.numeroPatrimonio;
        if (data.fieldErrors.categoria) errorCategoria.textContent = data.fieldErrors.categoria;
        if (data.fieldErrors.quantidade) errorQuantidade.textContent = data.fieldErrors.quantidade;
      }
      showToast('Erro de validação (HTTP 400): ' + ((data && data.message) || 'Dados inválidos'), 'error');
    } else {
      showToast(`Erro HTTP ${res.status}: ${(data && data.message) || 'Falha na requisição'}`, 'error');
    }
  } catch (err) {
    showToast('Falha na comunicação com a API: ' + err.message, 'error');
  }
}

/**
 * Remover Equipamento (DELETE /equipamentos/{id})
 */
async function deleteEquipamento(id, nome) {
  if (!confirm(`Deseja realmente remover o equipamento:\n"${nome}" (ID: #${id})?`)) {
    return;
  }

  if (isLocalMode) {
    const idx = allEquipamentos.findIndex(e => e.id === id);
    if (idx !== -1) {
      allEquipamentos.splice(idx, 1);
      saveLocalEquipamentos(allEquipamentos);
      showToast(`Equipamento #${id} removido com sucesso! (HTTP 204 No Content)`, 'success');
      
      // Se estava editando este item, resetar formulário
      if (formId.value && Number(formId.value) === id) {
        resetFormToCreateMode();
      }

      updateCategoryDropdown();
      updateStats();
      renderTable();
    } else {
      showToast(`Equipamento #${id} não encontrado (HTTP 404).`, 'error');
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (res.status === 204) {
      showToast(`Equipamento #${id} excluído com sucesso! (HTTP 204 No Content)`, 'success');
      if (formId.value && Number(formId.value) === id) {
        resetFormToCreateMode();
      }
      await loadEquipamentos();
    } else if (res.status === 404) {
      showToast(`Equipamento #${id} não encontrado no banco (HTTP 404).`, 'error');
      await loadEquipamentos();
    } else {
      showToast(`Erro ao excluir: HTTP ${res.status}`, 'error');
    }
  } catch (err) {
    showToast('Erro na requisição DELETE: ' + err.message, 'error');
  }
}

/**
 * Visualizar JSON de um item
 */
async function viewJsonDetails(id) {
  if (isLocalMode) {
    const item = allEquipamentos.find(e => e.id === id);
    if (item) {
      jsonModalContent.textContent = JSON.stringify(item, null, 2);
      jsonModal.classList.add('active');
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (res.ok) {
      const data = await res.json();
      jsonModalContent.textContent = JSON.stringify(data, null, 2);
      jsonModal.classList.add('active');
    } else {
      showToast(`Erro ao buscar dados: HTTP ${res.status}`, 'error');
    }
  } catch (err) {
    showToast('Falha na requisição: ' + err.message, 'error');
  }
}

/**
 * Sistema de Toasts
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<div style="flex: 1;">${escapeHtml(message)}</div>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}
