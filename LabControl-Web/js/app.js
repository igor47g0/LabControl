/**
 * LabControl - Frontend SPA Controller & Hybrid REST/Local Client
 * Funciona conectado à API Spring Boot ou de forma autônoma na Web.
 */

const API_BASE = window.location.protocol.startsWith('http') && window.location.port === '8080'
  ? '/equipamentos'
  : 'http://localhost:8080/equipamentos';

// Mock inicial para visualização autônoma na Web
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

// Estado da aplicação
let isLocalMode = false;
let allEquipamentos = [];
let activeFilterSearch = '';
let activeFilterCategory = '';

// Elementos do DOM
const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('filter-search');
const categorySelect = document.getElementById('filter-category');
const btnReload = document.getElementById('btn-reload');

// Contadores de estatísticas
const statTotalItems = document.getElementById('stat-total-items');
const statTotalStock = document.getElementById('stat-total-stock');
const statCategories = document.getElementById('stat-categories');
const statLowStock = document.getElementById('stat-low-stock');

// Modal de Criação / Edição
const equipmentModal = document.getElementById('equipment-modal');
const modalTitle = document.getElementById('modal-title');
const btnOpenCreate = document.getElementById('btn-open-modal-create');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const equipmentForm = document.getElementById('equipment-form');

// Inputs do Formulário
const formId = document.getElementById('form-id');
const formNome = document.getElementById('form-nome');
const formPatrimonio = document.getElementById('form-patrimonio');
const formCategoria = document.getElementById('form-categoria');
const formQuantidade = document.getElementById('form-quantidade');

// Mensagens de Erro dos Campos
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

// Container de Toasts
const toastContainer = document.getElementById('toast-container');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadEquipamentos();
});

function setupEventListeners() {
  btnOpenCreate.addEventListener('click', openCreateModal);
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);
  equipmentForm.addEventListener('submit', handleFormSubmit);

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
      .then(() => showToast('JSON copiado com sucesso!', 'success'))
      .catch(() => showToast('Erro ao copiar JSON.', 'error'));
  });

  // Fechar clicando no fundo escuro
  window.addEventListener('click', (e) => {
    if (e.target === equipmentModal) closeModal();
    if (e.target === jsonModal) jsonModal.classList.remove('active');
  });
}

/**
 * Carrega a lista de equipamentos da API ou do armazenamento local
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

  // Se estiver abrindo diretamente via arquivo file://, usar modo local direto
  if (window.location.protocol === 'file:') {
    isLocalMode = true;
    allEquipamentos = getLocalEquipamentos();
    updateModeIndicator();
    updateCategoryDropdown();
    updateStats();
    renderTable();
    return;
  }

  // Tentar buscar da API REST Spring Boot
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
    console.info('API Spring Boot inacessível, utilizando modo web local interativo.', err);
    isLocalMode = true;
    allEquipamentos = getLocalEquipamentos();
  }

  updateModeIndicator();
  updateCategoryDropdown();
  updateStats();
  renderTable();
}

/**
 * Atualiza o badge do modo no topo
 */
function updateModeIndicator() {
  const badgeContainer = document.querySelector('.announcement-content');
  if (!badgeContainer) return;

  const existingTag = document.getElementById('connection-status-tag');
  if (existingTag) existingTag.remove();

  const tag = document.createElement('span');
  tag.id = 'connection-status-tag';
  tag.className = 'pill-tag';

  if (isLocalMode) {
    tag.style.background = 'rgba(245, 158, 11, 0.2)';
    tag.style.color = '#fbbf24';
    tag.style.border = '1px solid rgba(245, 158, 11, 0.4)';
    tag.textContent = 'Modo Web Interativo (Demo Local)';
  } else {
    tag.style.background = 'rgba(16, 185, 129, 0.2)';
    tag.style.color = '#34d399';
    tag.style.border = '1px solid rgba(16, 185, 129, 0.4)';
    tag.textContent = 'Conectado à API Spring Boot (MySQL)';
  }

  badgeContainer.appendChild(tag);
}

/**
 * Armazenamento Local no Navegador
 */
function getLocalEquipamentos() {
  const saved = localStorage.getItem('labcontrol_equipamentos');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  localStorage.setItem('labcontrol_equipamentos', JSON.stringify(INITIAL_DEMO_DATA));
  return [...INITIAL_DEMO_DATA];
}

function saveLocalEquipamentos(list) {
  allEquipamentos = list;
  localStorage.setItem('labcontrol_equipamentos', JSON.stringify(list));
}

/**
 * Atualiza os contadores no topo
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
 * Atualiza as categorias no dropdown de filtro
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
 * Renderiza a tabela com os filtros aplicados
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
          <span style="font-size: 12px; color: #64748b;">Cadastre um novo item ou ajuste os termos de busca acima.</span>
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
            <button class="btn-action" title="Visualizar JSON" onclick="viewJsonDetails(${item.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </button>
            <button class="btn-action btn-action-edit" title="Editar Equipamento" onclick="openEditModal(${item.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>
            <button class="btn-action btn-action-delete" title="Excluir Equipamento" onclick="deleteEquipamento(${item.id}, '${escapeJs(item.nome)}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Abrir Modal para Criar
 */
function openCreateModal() {
  clearFormErrors();
  equipmentForm.reset();
  formId.value = '';
  modalTitle.textContent = 'Novo Equipamento';
  document.getElementById('btn-submit-modal').querySelector('.btn-text').textContent = 'Cadastrar Equipamento';
  equipmentModal.classList.add('active');
  formNome.focus();
}

/**
 * Abrir Modal para Editar
 */
function openEditModal(id) {
  const item = allEquipamentos.find(e => e.id === id);
  if (!item) return;

  clearFormErrors();
  formId.value = item.id;
  formNome.value = item.nome;
  formPatrimonio.value = item.numeroPatrimonio;
  formCategoria.value = item.categoria;
  formQuantidade.value = item.quantidade;

  modalTitle.textContent = `Editar Equipamento #${item.id}`;
  document.getElementById('btn-submit-modal').querySelector('.btn-text').textContent = 'Salvar Alterações';
  equipmentModal.classList.add('active');
  formNome.focus();
}

function closeModal() {
  equipmentModal.classList.remove('active');
  clearFormErrors();
}

function clearFormErrors() {
  errorNome.textContent = '';
  errorPatrimonio.textContent = '';
  errorCategoria.textContent = '';
  errorQuantidade.textContent = '';
}

/**
 * Submissão do Formulário (POST ou PUT)
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

  // Validações do Bean Validation
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

  if (hasError) return;

  // Se estiver em modo local, executar regras no navegador
  if (isLocalMode) {
    // Validação de unicidade de patrimônio
    const patrimonioDuplicado = allEquipamentos.some(item => {
      if (isEditing && item.id === id) return false;
      return item.numeroPatrimonio.toLowerCase() === payload.numeroPatrimonio.toLowerCase();
    });

    if (patrimonioDuplicado) {
      errorPatrimonio.textContent = `Já existe outro equipamento cadastrado com o número de patrimônio: ${payload.numeroPatrimonio}`;
      showToast(`Conflito de patrimônio (HTTP 409): O patrimônio ${payload.numeroPatrimonio} já está em uso!`, 'error');
      return;
    }

    if (isEditing) {
      const idx = allEquipamentos.findIndex(e => e.id === id);
      if (idx !== -1) {
        allEquipamentos[idx] = { id, ...payload };
        saveLocalEquipamentos(allEquipamentos);
        showToast(`Equipamento #${id} atualizado com sucesso! (HTTP 200)`, 'success');
      }
    } else {
      const newId = allEquipamentos.length > 0 ? Math.max(...allEquipamentos.map(e => e.id)) + 1 : 1;
      const novo = { id: newId, ...payload };
      allEquipamentos.push(novo);
      saveLocalEquipamentos(allEquipamentos);
      showToast(`Equipamento cadastrado com sucesso! (HTTP 201 Created)`, 'success');
    }

    closeModal();
    updateCategoryDropdown();
    updateStats();
    renderTable();
    return;
  }

  // Se estiver conectado à API Spring Boot
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
      closeModal();
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
      showToast('Erro de validação (HTTP 400): ' + ((data && data.message) || 'Campos inválidos'), 'error');
    } else {
      showToast(`Erro HTTP ${res.status}: ${(data && data.message) || 'Falha na requisição'}`, 'error');
    }
  } catch (err) {
    showToast('Falha na comunicação com a API: ' + err.message, 'error');
  }
}

/**
 * Excluir equipamento (DELETE /equipamentos/{id})
 */
async function deleteEquipamento(id, nome) {
  if (!confirm(`Tem certeza que deseja excluir o equipamento "${nome}" (ID: ${id})?`)) {
    return;
  }

  if (isLocalMode) {
    const idx = allEquipamentos.findIndex(e => e.id === id);
    if (idx !== -1) {
      allEquipamentos.splice(idx, 1);
      saveLocalEquipamentos(allEquipamentos);
      showToast(`Equipamento #${id} excluído com sucesso! (HTTP 204 No Content)`, 'success');
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
      showToast(`Equipamento #${id} removido com sucesso! (HTTP 204)`, 'success');
      await loadEquipamentos();
    } else if (res.status === 404) {
      showToast(`Equipamento #${id} não encontrado na base de dados (HTTP 404).`, 'error');
      await loadEquipamentos();
    } else {
      showToast(`Erro ao excluir: HTTP ${res.status}`, 'error');
    }
  } catch (err) {
    showToast('Erro na requisição DELETE: ' + err.message, 'error');
  }
}

/**
 * Visualizar JSON de um equipamento
 */
async function viewJsonDetails(id) {
  if (isLocalMode) {
    const item = allEquipamentos.find(e => e.id === id);
    if (item) {
      jsonModalContent.textContent = JSON.stringify(item, null, 2);
      jsonModal.classList.add('active');
    } else {
      showToast(`Equipamento não encontrado.`, 'error');
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
      showToast(`Erro ao buscar dados do equipamento: HTTP ${res.status}`, 'error');
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
