// ** ESTRUTURA DE DADOS GLOBAL **
let workspaces = [];
let nextWorkspaceId = 1; 
let nextCardId = 1;     

const STORAGE_KEY = 'kanbanWorkspacesData';

// ----------------------------------------------------
// ** PERSISTÊNCIA: Load e Save Data **
// ----------------------------------------------------

/**
 * Carrega os dados do localStorage ou inicializa com dados padrão se não houver.
 */
function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const loadedWorkspaces = JSON.parse(data);
        if (loadedWorkspaces.length > 0) {
            workspaces = loadedWorkspaces;
            
            // Recalcula os IDs máximos para evitar conflitos
            nextWorkspaceId = Math.max(...workspaces.map(ws => ws.id)) + 1;
            let maxCardId = 0;
            workspaces.forEach(ws => {
                if (ws.cards && ws.cards.length > 0) {
                    maxCardId = Math.max(maxCardId, ...ws.cards.map(card => card.id));
                }
            });
            nextCardId = maxCardId + 1;
            return;
        }
    }
    
    // Se não houver dados ou estiver vazio, inicializa com um workspace de exemplo.
    workspaces = [];
    // Salva a estrutura inicial no localStorage
    saveData();
}

/**
 * Salva a estrutura atual de workspaces no localStorage.
 */
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
}

// ----------------------------------------------------
// ** WORKSPACE: Variáveis e Funções do Modal **
// ----------------------------------------------------
const modalWorkspace = document.getElementById('modal-workspace');
const btnAdicionarWorkspace = document.getElementById('btn-adicionar-workspace');
const btnFecharWorkspace = modalWorkspace ? modalWorkspace.querySelector('.fechar') : null;
const formWorkspace = document.getElementById('form-workspace');
const workspaceContainerEl = document.getElementById('workspace-principal');

function ShowAddWorkspace() {
    if (modalWorkspace) {
        modalWorkspace.style.display = 'flex';
        formWorkspace.reset();
        document.getElementById('titulo-workspace').focus();
    }
}

function OcultarAddWorkspace() {
    if (modalWorkspace) {
        modalWorkspace.style.display = 'none';
        formWorkspace.reset();
    }
}

// ----------------------------------------------------
// ** WORKSPACE: CRUD e Renderização **
// ----------------------------------------------------

function createWorkspace(title, description) {
    const newWorkspace = {
        id: nextWorkspaceId++,
        title: title,
        description: description,
        cards: [] 
    };
    workspaces.push(newWorkspace);
    saveData(); // <--- SALVA DEPOIS DA CRIAÇÃO
    renderWorkspaces();
    return newWorkspace;
}

function renderWorkspaces() {
    const cardsContainer = workspaceContainerEl.querySelector('.workspace-cards');
    if (!cardsContainer) return;

    // Remove apenas os itens de cards e o botão 'Add Workspace' para re-renderizar
    cardsContainer.querySelectorAll('.workspace-card-item, .add-workspace-button').forEach(item => item.remove());

    workspaces.forEach(ws => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'workspace-card-item';
        itemDiv.dataset.workspaceId = ws.id;

        const p = document.createElement('p');
        p.className = 'text-card';
        p.textContent = ws.title;
        itemDiv.appendChild(p);

        // TODO: Adicionar lógica para EDITAR/EXCLUIR Workspace
        itemDiv.addEventListener('click', () => {
            console.log(`Carregar Workspace ID: ${ws.id}`);
            // No futuro, aqui você chamaria uma função como loadKanban(ws.id)
        });

        cardsContainer.appendChild(itemDiv);
    });

    // Recria e adiciona o botão 'Add Workspace'
    const addButton = document.createElement('div');
    addButton.className = 'add-workspace-button';
    addButton.id = 'btn-adicionar-workspace-novo'; 

    const h3 = document.createElement('h3');
    h3.className = 'text-card';
    h3.textContent = '+ Add Workspace';
    addButton.appendChild(h3);

    addButton.addEventListener('click', ShowAddWorkspace);
    cardsContainer.appendChild(addButton);
}

// ----------------------------------------------------
// ** CARD: Variáveis e Funções do Modal **
// ----------------------------------------------------
const modalCard = document.getElementById('modal-card');
const btnFecharCard = modalCard ? modalCard.querySelector('.fechar-card') : null;
const formCard = document.getElementById('form-card');
const btnDeleteCard = document.getElementById('btn-delete-card');

function ShowAddEditCard(columnId, cardId = null) {
    // Reseta o formulário
    formCard.reset();
    document.getElementById('card-column').value = columnId;
    btnDeleteCard.style.display = 'none';

    if (cardId) {
        // Modo Edição
        const currentWorkspace = workspaces[0]; // Assumindo o primeiro como o atual (para simplificar)
        const card = currentWorkspace ? currentWorkspace.cards.find(c => c.id === cardId) : null;
        
        if (card) {
            document.querySelector('.title-work').textContent = 'Editar Card';
            document.getElementById('card-id').value = card.id;
            document.getElementById('card-title').value = card.title;
            document.getElementById('card-description').value = card.description;
            // Formata a data para o formato yyyy-mm-dd para o input type="date"
            document.getElementById('card-deadline').value = card.deadline || '';
            document.getElementById('card-contributors').value = card.contributors || '';
            document.getElementById('card-type').value = card.type || 'feature';
            btnDeleteCard.style.display = 'inline-block';
        }
    } else {
        // Modo Adição
        document.querySelector('.title-work').textContent = 'Adicionar Novo Card';
        document.getElementById('card-id').value = '';
    }

    if (modalCard) {
        modalCard.style.display = 'flex';
        document.getElementById('card-title').focus();
    }
}

function OcultarAddEditCard() {
    if (modalCard) {
        modalCard.style.display = 'none';
        formCard.reset();
    }
}

// ----------------------------------------------------
// ** CARD: CRUD e Renderização **
// ----------------------------------------------------

function createUpdateCard(cardData, currentWorkspaceId = 1) {
    const currentWorkspace = workspaces.find(ws => ws.id === currentWorkspaceId);
    if (!currentWorkspace) return;

    if (cardData.id) {
        // Atualizar Card
        const index = currentWorkspace.cards.findIndex(c => c.id === cardData.id);
        if (index > -1) {
            // Atualiza os dados, mantendo a coluna (column) e o ID
            currentWorkspace.cards[index] = { ...currentWorkspace.cards[index], ...cardData };
        }
    } else {
        // Criar Novo Card
        const newCard = {
            id: nextCardId++,
            title: cardData.title,
            description: cardData.description,
            deadline: cardData.deadline,
            contributors: cardData.contributors,
            type: cardData.type,
            column: cardData.column // 'to-start', 'in-progress', 'done'
        };
        currentWorkspace.cards.push(newCard);
    }
    
    saveData(); // <--- SALVA DEPOIS DA CRIAÇÃO/EDIÇÃO
    renderCards(currentWorkspaceId);
}

function deleteCard(cardId, currentWorkspaceId = 1) {
    const currentWorkspace = workspaces.find(ws => ws.id === currentWorkspaceId);
    if (!currentWorkspace) return;

    currentWorkspace.cards = currentWorkspace.cards.filter(c => c.id !== cardId);
    saveData(); // <--- SALVA DEPOIS DA DELEÇÃO
    renderCards(currentWorkspaceId);
    OcultarAddEditCard();
}

/**
 * Renderiza os cards para um workspace específico (assumindo o ID 1)
 */
function renderCards(workspaceId = 1) {
    const currentWorkspace = workspaces.find(ws => ws.id === workspaceId);
    if (!currentWorkspace) return;

    const columns = ['to-start', 'in-progress', 'done'];

    columns.forEach(columnId => {
        // Encontrar o elemento pai da coluna (o div interno que contém os cards e o botão 'Add Card')
        const columnInnerEl = document.querySelector(`.card[data-column-id="${columnId}"] > div`);
        if (!columnInnerEl) return;
        
        // Remove cards existentes
        columnInnerEl.querySelectorAll(`.card-item-start, .card-item-progress, .card-item-done`).forEach(card => card.remove());

        // Filtrar cards para a coluna
        const cardsInColumn = currentWorkspace.cards.filter(card => card.column === columnId);

        cardsInColumn.forEach(card => {
            const cardDiv = document.createElement('div');
            
            // Determina a classe CSS correta para a cor
            let cardClass;
            if (card.column === 'to-start') {
                cardClass = 'card-item-start';
            } else if (card.column === 'in-progress') {
                cardClass = 'card-item-progress';
            } else if (card.column === 'done') {
                cardClass = 'card-item-done';
            } else {
                cardClass = 'card-item-start'; // Fallback
            }

            cardDiv.className = cardClass;
            cardDiv.dataset.cardId = card.id;
            cardDiv.draggable = true; // Para futura implementação de Drag and Drop

            const p = document.createElement('p');
            p.className = 'text-card';
            // Exibe a data de entrega se existir
            const deadlineText = card.deadline ? `<br/>Deadline: ${card.deadline}` : '';
            p.innerHTML = `${card.title}${deadlineText}`;
            cardDiv.appendChild(p);

            // Adicionar listener para Edição
            cardDiv.addEventListener('click', () => ShowAddEditCard(card.column, card.id));

            // Inserir o novo card antes do botão 'Add Card'
            const addButton = columnInnerEl.querySelector('.add-card-button');
            columnInnerEl.insertBefore(cardDiv, addButton);
        });
    });
}

// ----------------------------------------------------
// ** CONFIGURAÇÃO INICIAL e LISTENERS **
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Carrega os dados persistidos
    loadData();

    // 2. Renderiza a visualização inicial
    renderWorkspaces();
    renderCards(workspaces[0].id); // Renderiza os cards do primeiro workspace

    // WORKSPACE LISTENERS
    const currentAddButton = document.getElementById('btn-adicionar-workspace');
    if (currentAddButton) {
        // No DOM original, pode haver um com ID 'btn-adicionar-workspace'
        currentAddButton.addEventListener('click', ShowAddWorkspace);
    }
    // O novo botão recriado na renderização tem o ID 'btn-adicionar-workspace-novo' e já tem listener

    if (btnFecharWorkspace) {
        btnFecharWorkspace.addEventListener('click', OcultarAddWorkspace);
    }
    window.addEventListener('click', (event) => {
        if (event.target === modalWorkspace) {
            OcultarAddWorkspace();
        }
    });
    if (formWorkspace) {
        formWorkspace.addEventListener('submit', (event) => {
            event.preventDefault();
            const titulo = document.getElementById('titulo-workspace').value;
            const descricao = document.getElementById('descricao-workspace').value;
            createWorkspace(titulo, descricao);
            OcultarAddWorkspace();
        });
    }

    // CARD LISTENERS
    // 1. Mostrar Modal Card ao clicar em '+ Add Card'
    document.querySelectorAll('.add-card-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const columnId = button.dataset.column;
            ShowAddEditCard(columnId);
        });
    });

    // 2. Fechar Modal Card
    if (btnFecharCard) {
        btnFecharCard.addEventListener('click', OcultarAddEditCard);
    }
    window.addEventListener('click', (event) => {
        if (event.target === modalCard) {
            OcultarAddEditCard();
        }
    });
    
    // 3. Submeter Formulário Card (Criação/Edição)
    if (formCard) {
        formCard.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const cardData = {
                id: document.getElementById('card-id').value ? parseInt(document.getElementById('card-id').value) : null,
                title: document.getElementById('card-title').value,
                description: document.getElementById('card-description').value,
                deadline: document.getElementById('card-deadline').value,
                contributors: document.getElementById('card-contributors').value,
                type: document.getElementById('card-type').value,
                column: document.getElementById('card-column').value
            };
            
            createUpdateCard(cardData);
            OcultarAddEditCard();
        });
    }

    // 4. Deletar Card
    if (btnDeleteCard) {
        btnDeleteCard.addEventListener('click', () => {
            const cardId = parseInt(document.getElementById('card-id').value);
            if (confirm("Tem certeza que deseja deletar este Card?")) {
                deleteCard(cardId);
            }
        });
    }

});

function renderCards(workspaceId = 1) {
    const currentWorkspace = workspaces.find(ws => ws.id === workspaceId);
    if (!currentWorkspace) return;

    const columns = ['to-start', 'in-progress', 'done'];

    columns.forEach(columnId => {
        const columnInnerEl = document.querySelector(`.card[data-column-id="${columnId}"] > div`);
        if (!columnInnerEl) return;
        
        // Remove cards existentes
        columnInnerEl.querySelectorAll(`.card-item-start, .card-item-progress, .card-item-done`).forEach(card => card.remove());

        const cardsInColumn = currentWorkspace.cards.filter(card => card.column === columnId);

        cardsInColumn.forEach(card => {
            const cardDiv = document.createElement('div');
            
            // Determina a classe CSS correta para a cor
            let cardClass;
            if (card.column === 'to-start') {
                cardClass = 'card-item-start';
            } else if (card.column === 'in-progress') {
                cardClass = 'card-item-progress';
            } else if (card.column === 'done') {
                cardClass = 'card-item-done';
            } else {
                cardClass = 'card-item-start'; // Fallback
            }

            cardDiv.className = cardClass;
            cardDiv.dataset.cardId = card.id;
            cardDiv.draggable = true; // Torna o elemento arrastável
            
            // >>> ADICIONA O EVENT LISTENER PARA COMEÇAR O ARRASTO <<<
            cardDiv.addEventListener('dragstart', dragStart);

            const p = document.createElement('p');
            p.className = 'text-card';
            const deadlineText = card.deadline ? `<br/>Deadline: ${formatDate(card.deadline)}` : '';
            p.innerHTML = `${card.title}${deadlineText}`;
            cardDiv.appendChild(p);

            // Adicionar listener para Edição
            cardDiv.addEventListener('click', (e) => {
                // Impede que o click no card acione o drag
                if (e.detail === 1) { 
                    ShowAddEditCard(card.column, card.id);
                }
            });

            const addButton = columnInnerEl.querySelector('.add-card-button');
            columnInnerEl.insertBefore(cardDiv, addButton);
        });
    });
}

/**
 * Função auxiliar para formatar a data (opcional)
 */
function formatDate(dateString) {
    if (!dateString) return 'XX/XX';
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
}


// ----------------------------------------------------
// ** DRAG AND DROP FUNÇÕES **
// ----------------------------------------------------

/**
 * Inicia o arraste do card, armazenando seu ID.
 */
function dragStart(event) {
    // Armazena o ID do card que está sendo arrastado no objeto de transferência de dados
    event.dataTransfer.setData('text/plain', event.target.dataset.cardId);
    // Adiciona uma classe visual enquanto arrasta (opcional)
    setTimeout(() => {
        event.target.classList.add('dragging');
    }, 0); 
}

/**
 * Permite que um elemento seja solto na área.
 */
function dragOver(event) {
    event.preventDefault(); // Necessário para permitir o drop
}

/**
 * Lida com o evento de soltar o card.
 */
function drop(event) {
    event.preventDefault();

    // 1. Obtém o ID do card arrastado
    const cardIdStr = event.dataTransfer.getData('text/plain');
    if (!cardIdStr) return;
    const cardId = parseInt(cardIdStr);
    
    // 2. Remove a classe de arrasto
    const draggedEl = document.querySelector(`.card-item-start[data-card-id="${cardIdStr}"], .card-item-progress[data-card-id="${cardIdStr}"], .card-item-done[data-card-id="${cardIdStr}"]`);
    if (draggedEl) {
        draggedEl.classList.remove('dragging');
    }

    // 3. Identifica a coluna de destino (Target)
    // O evento pode ocorrer no 'card' (coluna), no 'card-started', 'card-progress', etc., ou no botão 'add-card-button'
    let dropTarget = event.target.closest('.card, .card-started, .card-progress, .card-done');

    if (!dropTarget) return;

    // Garante que o alvo é o container principal da coluna para obter o data-column-id
    if (!dropTarget.dataset.columnId) {
        dropTarget = dropTarget.closest('.card');
    }
    
    const newColumnId = dropTarget.dataset.columnId;
    if (!newColumnId) return;

    // 4. Encontra o card no JSON e atualiza a coluna
    const currentWorkspace = workspaces[0]; // Assumindo o Workspace 1 (o ativo)
    const cardIndex = currentWorkspace.cards.findIndex(c => c.id === cardId);

    if (cardIndex > -1 && currentWorkspace.cards[cardIndex].column !== newColumnId) {
        // Atualiza a coluna no objeto
        currentWorkspace.cards[cardIndex].column = newColumnId;
        
        // Salva os dados atualizados no localStorage
        saveData();

        // 5. Re-renderiza a visualização para refletir a mudança (ou apenas move o elemento DOM)
        // A re-renderização completa é mais simples para garantir que classes de cor sejam aplicadas.
        renderCards(currentWorkspace.id); 
    }
}


// ----------------------------------------------------
// ** CONFIGURAÇÃO INICIAL e LISTENERS (continuação) **
// ----------------------------------------------------
