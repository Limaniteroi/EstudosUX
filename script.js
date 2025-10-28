(function() {
    'use strict';

    const COLUMN_CONFIG = {
        'card-start': 'card-item-start',
        'card-progress': 'card-item-progress',
        'card-done': 'card-item-done'
    };

    const PRIORITY_LABELS = {
        'low': 'Baixa',
        'medium': 'Média',
        'high': 'Alta'
    };

    let currentColumn = null;
    let currentCardListContainer = null;
    let editingCard = null;
    let editingWorkspace = null;
    let cardIdCounter = 0;
    let workspaceIdCounter = 0;

    // ========== FUNÇÕES DE ARMAZENAMENTO LOCAL ==========

    function saveToLocalStorage() {
        const data = {
            cards: [],
            workspaces: [],
            cardIdCounter: cardIdCounter,
            workspaceIdCounter: workspaceIdCounter
        };

        // Salvar todos os cards
        const allCards = document.querySelectorAll('[data-card-id]');
        allCards.forEach(card => {
            const columnClass = Array.from(card.classList).find(cls => 
                cls === 'card-item-start' || cls === 'card-item-progress' || cls === 'card-item-done'
            );
            
            data.cards.push({
                id: card.getAttribute('data-card-id'),
                title: card.dataset.title,
                description: card.dataset.description,
                deadline: card.dataset.deadline,
                contributors: card.dataset.contributors,
                priority: card.dataset.priority,
                column: columnClass
            });
        });

        // Salvar todos os workspaces
        const allWorkspaces = document.querySelectorAll('[data-workspace-id]');
        allWorkspaces.forEach(workspace => {
            data.workspaces.push({
                id: workspace.getAttribute('data-workspace-id'),
                name: workspace.dataset.name,
                description: workspace.dataset.description
            });
        });

        localStorage.setItem('kanbanData', JSON.stringify(data));
    }

    function loadFromLocalStorage() {
        const savedData = localStorage.getItem('kanbanData');
        if (!savedData) return;

        try {
            const data = JSON.parse(savedData);
            
            // Restaurar contadores
            cardIdCounter = data.cardIdCounter || 0;
            workspaceIdCounter = data.workspaceIdCounter || 0;

            // Restaurar cards
            if (data.cards && data.cards.length > 0) {
                data.cards.forEach(cardData => {
                    // Encontrar a coluna correta
                    let columnElement = null;
                    if (cardData.column === 'card-item-start') {
                        columnElement = document.querySelector('.card-start');
                    } else if (cardData.column === 'card-item-progress') {
                        columnElement = document.querySelector('.card-progress');
                    } else if (cardData.column === 'card-item-done') {
                        columnElement = document.querySelector('.card-done');
                    }

                    if (columnElement) {
                        const cardListContainer = columnElement.querySelector('.card-list-content');
                        const columnClass = Array.from(columnElement.classList).find(cls => cls.startsWith('card-'));
                        
                        currentCardListContainer = cardListContainer;
                        currentColumn = columnClass;
                        
                        createCard(
                            cardData.title,
                            cardData.description,
                            cardData.deadline,
                            cardData.contributors,
                            cardData.priority,
                            cardData.id
                        );
                    }
                });
            }

            // Restaurar workspaces
            if (data.workspaces && data.workspaces.length > 0) {
                data.workspaces.forEach(workspaceData => {
                    createWorkspace(
                        workspaceData.name,
                        workspaceData.description,
                        workspaceData.id
                    );
                });
            }
        } catch (error) {
            console.error('Erro ao carregar dados do localStorage:', error);
        }
    }

    // ========== FUNÇÕES DE CARDS ==========

    function openModal(cardListContainer, columnClass, cardData = null) {
        currentCardListContainer = cardListContainer;
        currentColumn = columnClass;
        editingCard = cardData;

        const modal = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitleText');
        
        if (cardData) {
            modalTitle.textContent = 'Editar Tarefa';
            document.getElementById('modal-title-input').value = cardData.title;
            document.getElementById('modal-description').value = cardData.description || '';
            document.getElementById('modal-deadline').value = cardData.deadline || '';
            document.getElementById('modal-contributors').value = cardData.contributors || '';

            const typeButtons = modal.querySelectorAll('.type-button');
            typeButtons.forEach(btn => btn.classList.remove('active'));
            modal.querySelector(`[data-type="${cardData.priority}"]`).classList.add('active');
        } else {
            modalTitle.textContent = 'Nova Tarefa';
            document.getElementById('modal-title-input').value = '';
            document.getElementById('modal-description').value = '';
            document.getElementById('modal-deadline').value = '';
            document.getElementById('modal-contributors').value = '';

            const typeButtons = modal.querySelectorAll('.type-button');
            typeButtons.forEach(btn => btn.classList.remove('active'));
            modal.querySelector('[data-type="medium"]').classList.add('active');
        }

        modal.classList.add('active');
    }

    function closeModal() {
        const modal = document.getElementById('modalOverlay');
        modal.classList.remove('active');
        currentColumn = null;
        currentCardListContainer = null;
        editingCard = null;
    }

    function formatDate(dateString) {
        if (!dateString) return 'Sem prazo';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    }

    function createCard(title, description, deadline, contributors, priority, cardId = null) {
        const id = cardId || `card-${cardIdCounter++}`;
        const newCardItem = document.createElement('div');
        const cardClass = COLUMN_CONFIG[currentColumn];
        newCardItem.classList.add(cardClass);
        newCardItem.setAttribute('data-card-id', id);
        
        newCardItem.dataset.title = title;
        newCardItem.dataset.description = description || '';
        newCardItem.dataset.deadline = deadline || '';
        newCardItem.dataset.contributors = contributors || '';
        newCardItem.dataset.priority = priority;
        
        const cardHeader = document.createElement('div');
        cardHeader.classList.add('card-header');
        
        const titleEl = document.createElement('div');
        titleEl.classList.add('card-title');
        titleEl.textContent = title;
        
        const menuButton = document.createElement('button');
        menuButton.classList.add('card-menu-button');
        menuButton.innerHTML = '⋮';
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCardMenu(newCardItem);
        });
        
        cardHeader.appendChild(titleEl);
        cardHeader.appendChild(menuButton);
        
        const cardMenu = document.createElement('div');
        cardMenu.classList.add('card-menu');
        
        const viewButton = document.createElement('button');
        viewButton.classList.add('card-menu-item');
        viewButton.innerHTML = '👁️ Ver detalhes';
        viewButton.addEventListener('click', (e) => {
            e.stopPropagation();
            viewCardDetails(newCardItem);
        });
        
        const editButton = document.createElement('button');
        editButton.classList.add('card-menu-item');
        editButton.innerHTML = '✏️ Editar';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            editCard(newCardItem);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('card-menu-item', 'delete');
        deleteButton.innerHTML = '🗑️ Excluir';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCard(newCardItem);
        });
        
        cardMenu.appendChild(viewButton);
        cardMenu.appendChild(editButton);
        cardMenu.appendChild(deleteButton);
        
        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content');
        
        const priorityEl = document.createElement('div');
        priorityEl.classList.add('card-priority');
        priorityEl.innerHTML = `
            <span class="priority-dot ${priority}"></span>
            <span>${PRIORITY_LABELS[priority]}</span>
        `;
        cardContent.appendChild(priorityEl);
        
        const deadlineEl = document.createElement('div');
        deadlineEl.classList.add('card-deadline');
        deadlineEl.textContent = `📅 ${formatDate(deadline)}`;
        cardContent.appendChild(deadlineEl);
        
        newCardItem.appendChild(cardHeader);
        newCardItem.appendChild(cardMenu);
        newCardItem.appendChild(cardContent);
        
        makeCardDraggable(newCardItem);
        currentCardListContainer.appendChild(newCardItem);
        
        // Salvar no localStorage
        saveToLocalStorage();
    }

    function toggleCardMenu(card) {
        const menu = card.querySelector('.card-menu');
        const allMenus = document.querySelectorAll('.card-menu, .workspace-menu');
        
        allMenus.forEach(m => {
            if (m !== menu) m.classList.remove('active');
        });
        
        menu.classList.toggle('active');
    }

    function viewCardDetails(card) {
        const menu = card.querySelector('.card-menu');
        menu.classList.remove('active');
        
        const title = card.dataset.title;
        const description = card.dataset.description;
        const deadline = card.dataset.deadline;
        const contributors = card.dataset.contributors;
        const priority = card.dataset.priority;
        
        let details = `📌 ${title}\n\n`;
        if (description) details += `Descrição:\n${description}\n\n`;
        details += `Prioridade: ${PRIORITY_LABELS[priority]}\n`;
        details += `Prazo: ${formatDate(deadline)}\n`;
        if (contributors) details += `Colaboradores: ${contributors}`;
        
        alert(details);
    }

    function editCard(card) {
        const menu = card.querySelector('.card-menu');
        menu.classList.remove('active');
        
        const columnClass = Array.from(card.parentElement.parentElement.classList).find(cls => cls.startsWith('card-'));
        
        const cardData = {
            element: card,
            title: card.dataset.title,
            description: card.dataset.description,
            deadline: card.dataset.deadline,
            contributors: card.dataset.contributors,
            priority: card.dataset.priority
        };
        
        openModal(card.parentElement, columnClass, cardData);
    }

    function deleteCard(card) {
        const menu = card.querySelector('.card-menu');
        menu.classList.remove('active');
        
        if (confirm('Deseja realmente excluir esta tarefa?')) {
            card.remove();
            // Salvar no localStorage
            saveToLocalStorage();
        }
    }

    function makeCardDraggable(card) {
        card.setAttribute('draggable', 'true');
        
        card.addEventListener('dragstart', function(e) {
            const menu = card.querySelector('.card-menu');
            if (menu) menu.classList.remove('active');
            
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        card.addEventListener('dragend', function() {
            card.classList.remove('dragging');
            // Salvar no localStorage após mover o card
            saveToLocalStorage();
        });
    }

    function setupDropZone(cardListContainer) {
        cardListContainer.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const draggingCard = document.querySelector('.dragging');
            
            if (draggingCard) {
                const afterElement = getDragAfterElement(cardListContainer, e.clientY);
                
                if (afterElement == null) {
                    cardListContainer.appendChild(draggingCard);
                } else {
                    cardListContainer.insertBefore(draggingCard, afterElement);
                }
            }
        });
        
        cardListContainer.addEventListener('drop', function(e) {
            e.preventDefault();
            const draggingCard = document.querySelector('.dragging');
            
            if (draggingCard) {
                const targetColumn = cardListContainer.parentElement;
                
                let columnClass = null;
                for (let cls of targetColumn.classList) {
                    if (COLUMN_CONFIG.hasOwnProperty(cls)) {
                        columnClass = cls;
                        break;
                    }
                }
                
                if (columnClass) {
                    const newCardClass = COLUMN_CONFIG[columnClass];
                    draggingCard.classList.remove(...Object.values(COLUMN_CONFIG));
                    draggingCard.classList.add(newCardClass);
                }
            }
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function setupCardAddition(addButton) {
        const kanbanColumn = addButton.parentNode;
        const cardListContainer = kanbanColumn.querySelector('.card-list-content');
        const columnClass = Array.from(kanbanColumn.classList).find(cls => cls.startsWith('card-'));

        addButton.addEventListener('click', function() {
            openModal(cardListContainer, columnClass);
        });
    }

    function setupModalEvents() {
        const modal = document.getElementById('modalOverlay');
        const modalClose = document.getElementById('modalClose');
        const modalCancel = document.getElementById('modalCancel');
        const modalSave = document.getElementById('modalSave');
        
        modalClose.addEventListener('click', closeModal);
        modalCancel.addEventListener('click', closeModal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        const typeButtons = modal.querySelectorAll('.type-button');
        typeButtons.forEach(button => {
            button.addEventListener('click', function() {
                typeButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        modalSave.addEventListener('click', function() {
            const title = document.getElementById('modal-title-input').value.trim();
            const description = document.getElementById('modal-description').value.trim();
            const deadline = document.getElementById('modal-deadline').value;
            const contributors = document.getElementById('modal-contributors').value.trim();
            const priority = modal.querySelector('.type-button.active').dataset.type;
            
            if (!title) {
                alert('Por favor, adicione um título!');
                return;
            }
            
            if (editingCard && editingCard.element) {
                const card = editingCard.element;
                card.dataset.title = title;
                card.dataset.description = description;
                card.dataset.deadline = deadline;
                card.dataset.contributors = contributors;
                card.dataset.priority = priority;
                
                card.querySelector('.card-title').textContent = title;
                card.querySelector('.card-priority').innerHTML = `
                    <span class="priority-dot ${priority}"></span>
                    <span>${PRIORITY_LABELS[priority]}</span>
                `;
                card.querySelector('.card-deadline').textContent = `📅 ${formatDate(deadline)}`;
                
                // Salvar no localStorage
                saveToLocalStorage();
            } else {
                createCard(title, description, deadline, contributors, priority);
            }
            
            closeModal();
        });
    }

    // ========== FUNÇÕES DE WORKSPACE ==========

    function openWorkspaceModal(workspaceData = null) {
        editingWorkspace = workspaceData;

        const modal = document.getElementById('modalWorkspaceOverlay');
        const modalTitle = document.getElementById('modalWorkspaceTitleText');
        
        if (workspaceData) {
            modalTitle.textContent = 'Editar Workspace';
            document.getElementById('modal-workspace-name').value = workspaceData.name;
            document.getElementById('modal-workspace-description').value = workspaceData.description || '';
        } else {
            modalTitle.textContent = 'Novo Workspace';
            document.getElementById('modal-workspace-name').value = '';
            document.getElementById('modal-workspace-description').value = '';
        }

        modal.classList.add('active');
    }

    function closeWorkspaceModal() {
        const modal = document.getElementById('modalWorkspaceOverlay');
        modal.classList.remove('active');
        editingWorkspace = null;
    }

    function createWorkspace(name, description, workspaceId = null) {
        const id = workspaceId || `workspace-${workspaceIdCounter++}`;
        const workspaceCardsContainer = document.querySelector('.workspace-cards');
        const addButton = document.querySelector('.add-workspace-button');
        
        const newWorkspaceItem = document.createElement('div');
        newWorkspaceItem.classList.add('workspace-card-item');
        newWorkspaceItem.setAttribute('data-workspace-id', id);
        
        newWorkspaceItem.dataset.name = name;
        newWorkspaceItem.dataset.description = description || '';

        const workspaceName = document.createElement('p');
        workspaceName.classList.add('text-card', 'workspace-name');
        workspaceName.textContent = name;

        const menuButton = document.createElement('button');
        menuButton.classList.add('workspace-menu-button');
        menuButton.innerHTML = '⋮';
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWorkspaceMenu(newWorkspaceItem);
        });

        const workspaceMenu = document.createElement('div');
        workspaceMenu.classList.add('workspace-menu');
        
        const viewButton = document.createElement('button');
        viewButton.classList.add('workspace-menu-item');
        viewButton.innerHTML = '👁️ Ver detalhes';
        viewButton.addEventListener('click', (e) => {
            e.stopPropagation();
            viewWorkspaceDetails(newWorkspaceItem);
        });
        
        const editButton = document.createElement('button');
        editButton.classList.add('workspace-menu-item');
        editButton.innerHTML = '✏️ Editar';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            editWorkspace(newWorkspaceItem);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('workspace-menu-item', 'delete');
        deleteButton.innerHTML = '🗑️ Excluir';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteWorkspace(newWorkspaceItem);
        });
        
        workspaceMenu.appendChild(viewButton);
        workspaceMenu.appendChild(editButton);
        workspaceMenu.appendChild(deleteButton);

        newWorkspaceItem.appendChild(workspaceName);
        newWorkspaceItem.appendChild(menuButton);
        newWorkspaceItem.appendChild(workspaceMenu);

        workspaceCardsContainer.insertBefore(newWorkspaceItem, addButton);
        
        // Salvar no localStorage
        saveToLocalStorage();
    }

    function toggleWorkspaceMenu(workspace) {
        const menu = workspace.querySelector('.workspace-menu');
        const allMenus = document.querySelectorAll('.card-menu, .workspace-menu');
        
        allMenus.forEach(m => {
            if (m !== menu) m.classList.remove('active');
        });
        
        menu.classList.toggle('active');
    }

    function viewWorkspaceDetails(workspace) {
        const menu = workspace.querySelector('.workspace-menu');
        menu.classList.remove('active');
        
        const name = workspace.dataset.name;
        const description = workspace.dataset.description;
        
        let details = `🗂️ ${name}\n\n`;
        if (description) details += `Descrição:\n${description}`;
        else details += 'Sem descrição';
        
        alert(details);
    }

    function editWorkspace(workspace) {
        const menu = workspace.querySelector('.workspace-menu');
        menu.classList.remove('active');
        
        const workspaceData = {
            element: workspace,
            name: workspace.dataset.name,
            description: workspace.dataset.description
        };
        
        openWorkspaceModal(workspaceData);
    }

    function deleteWorkspace(workspace) {
        const menu = workspace.querySelector('.workspace-menu');
        menu.classList.remove('active');
        
        if (confirm('Deseja realmente excluir este workspace?')) {
            workspace.remove();
            // Salvar no localStorage
            saveToLocalStorage();
        }
    }

    function setupWorkspaceAddition(addWorkspaceButton) {
        addWorkspaceButton.addEventListener('click', function() {
            openWorkspaceModal();
        });
    }

    function setupWorkspaceModalEvents() {
        const modal = document.getElementById('modalWorkspaceOverlay');
        const modalClose = document.getElementById('modalWorkspaceClose');
        const modalCancel = document.getElementById('modalWorkspaceCancel');
        const modalSave = document.getElementById('modalWorkspaceSave');
        
        modalClose.addEventListener('click', closeWorkspaceModal);
        modalCancel.addEventListener('click', closeWorkspaceModal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeWorkspaceModal();
            }
        });
        
        modalSave.addEventListener('click', function() {
            const name = document.getElementById('modal-workspace-name').value.trim();
            const description = document.getElementById('modal-workspace-description').value.trim();
            
            if (!name) {
                alert('Por favor, adicione um nome para o workspace!');
                return;
            }
            
            if (editingWorkspace && editingWorkspace.element) {
                const workspace = editingWorkspace.element;
                workspace.dataset.name = name;
                workspace.dataset.description = description;
                
                workspace.querySelector('.workspace-name').textContent = name;
                
                // Salvar no localStorage
                saveToLocalStorage();
            } else {
                createWorkspace(name, description);
            }
            
            closeWorkspaceModal();
        });
    }

    // Fechar menus ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.card-menu') && 
            !e.target.closest('.card-menu-button') &&
            !e.target.closest('.workspace-menu') && 
            !e.target.closest('.workspace-menu-button')) {
            const allMenus = document.querySelectorAll('.card-menu, .workspace-menu');
            allMenus.forEach(menu => menu.classList.remove('active'));
        }
    });

    // Inicializar
    function initializeKanban() {
        // Carregar dados salvos
        loadFromLocalStorage();
        
        setupModalEvents();
        setupWorkspaceModalEvents();
        
        const addButtons = document.querySelectorAll('.add-card-button');
        addButtons.forEach(setupCardAddition);

        const addWorkspaceButton = document.querySelector('.add-workspace-button');
        if (addWorkspaceButton) {
            setupWorkspaceAddition(addWorkspaceButton);
        }

        const cardListContainers = document.querySelectorAll('.card-list-content');
        cardListContainers.forEach(setupDropZone);
    }

    document.addEventListener('DOMContentLoaded', initializeKanban);
})();