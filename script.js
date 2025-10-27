(function() {
    'use strict';

    const COLUMN_CONFIG = {
        'card-start': 'card-item-start',
        'card-progress': 'card-item-progress',
        'card-done': 'card-item-done'
    };

    // Variáveis globais para armazenar o contexto do modal
    let currentColumn = null;
    let currentCardListContainer = null;
    let modalEventsInitialized = false; // Garante que os eventos do modal sejam configurados apenas uma vez

    // Função createModal removida: O modal já existe no DOM (modal.html).

    function openModal(cardListContainer, columnClass) {
        currentCardListContainer = cardListContainer;
        currentColumn = columnClass;

        let modal = document.querySelector('.modal-overlay');
        
        if (!modal) {
             console.error("Modal overlay não encontrado. Verifique se modal.html está incluído.");
             return;
        }

        // Resetar campos
        document.getElementById('modal-title').value = '';
        document.getElementById('modal-description').value = '';
        document.getElementById('modal-deadline').value = '';
        document.getElementById('modal-contributors').value = '';

        // Selecionar o tipo correto baseado na coluna
        const typeButtons = modal.querySelectorAll('.type-button');
        typeButtons.forEach(btn => btn.classList.remove('active'));
        
        let selectedType = 'start';
        if (columnClass && columnClass.includes('progress')) selectedType = 'progress';
        else if (columnClass && columnClass.includes('done')) selectedType = 'done';
        // Default para 'start'
        
        const selectedButton = modal.querySelector(`[data-type="${selectedType}"]`);
        if (selectedButton) selectedButton.classList.add('active');

        modal.style.display = 'flex';
    }

    function closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function setupModalEvents() {
        const modal = document.querySelector('.modal-overlay');
        if (!modal) return;
        
        // Botão fechar
        modal.querySelector('.modal-close').addEventListener('click', closeModal);

        // Fechar ao clicar fora
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Seleção de tipo
        const typeButtons = modal.querySelectorAll('.type-button');
        typeButtons.forEach(button => {
            button.addEventListener('click', function() {
                typeButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Botão salvar
        modal.querySelector('.modal-save').addEventListener('click', function() {
            const title = document.getElementById('modal-title').value.trim();
            const description = document.getElementById('modal-description').value.trim();
            const deadline = document.getElementById('modal-deadline').value;
            const contributors = document.getElementById('modal-contributors').value.trim();
            
            if (!title) {
                alert('Por favor, adicione um título!');
                return;
            }
            
            // Verificação de segurança: Container deve existir
            if (!currentCardListContainer) {
                 console.error("Erro: Container de lista de cards não definido ao salvar.");
                 return;
            }

            const selectedType = modal.querySelector('.type-button.active');
            const type = selectedType ? selectedType.dataset.type : 'start';
            
            const cardClass = COLUMN_CONFIG[`card-${type}`];
            
            createCard(title, description, deadline, contributors, cardClass);
            closeModal();
        });
        
        modalEventsInitialized = true; // Marca como inicializado
    }

    function createCard(title, description, deadline, contributors, cardClass) {
        const newCardItem = document.createElement('div');
        // CORREÇÃO ESSENCIAL: Adiciona a classe base 'card-item' (para estilização e seleção) e a classe de tipo
        newCardItem.classList.add('card-item', cardClass); 
        
        const cardContent = document.createElement('p');
        cardContent.classList.add('text-card');
        
        let cardText = `<strong>${title}</strong>`;
        if (description) cardText += `<br/>${description}`;
        if (deadline) cardText += `<br/>Deadline: ${formatDate(deadline)}`;
        if (contributors) cardText += `<br/>Por: ${contributors}`;
        
        cardContent.innerHTML = cardText;
        newCardItem.appendChild(cardContent);
        
        makeCardDraggable(newCardItem);
        currentCardListContainer.appendChild(newCardItem);
    }

    function formatDate(dateString) {
        if (!dateString) return 'TBA';
        // CORREÇÃO DE DATA: Trata a data para evitar problemas de fuso horário
        const date = new Date(dateString.replace(/-/g, '\/')); 
        return date.toLocaleDateString('pt-BR');
    }

    function makeCardDraggable(card) {
        card.setAttribute('draggable', 'true');
        
        card.addEventListener('dragstart', function(e) {
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', 'dragging-card'); 
        });
        
        card.addEventListener('dragend', function() {
            card.classList.remove('dragging');
        });
    }

    function setupDropZone(cardListContainer) {
        // DRAGOVER: Lida com a reordenação em tempo real
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
        
        // DROP: Lida com a mudança de classe (cor)
        cardListContainer.addEventListener('drop', function(e) {
            e.preventDefault();
            const draggingCard = document.querySelector('.dragging');
            
            if (draggingCard) {
                let targetColumn = cardListContainer.parentElement;
                
                let columnClass = null;
                // Encontra a classe da coluna (card-start, card-progress, etc.)
                for (let cls of targetColumn.classList) {
                    if (COLUMN_CONFIG.hasOwnProperty(cls)) { 
                        columnClass = cls;
                        break;
                    }
                }
                
                if (columnClass) {
                    const newCardClass = COLUMN_CONFIG[columnClass];
                    
                    // CORREÇÃO DRAG & DROP: Remove todas as classes de tipo anteriores de forma dinâmica
                    draggingCard.classList.remove(...Object.values(COLUMN_CONFIG));
                    
                    // Adiciona a classe correta para a nova coluna
                    draggingCard.classList.add(newCardClass);
                    
                    console.log(`Card movido para ${columnClass}, classe aplicada: ${newCardClass}`);
                } else {
                    console.error('Não foi possível determinar a coluna de destino');
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

        if (!cardListContainer) {
            console.error("Elemento '.card-list-content' não encontrado na coluna.", kanbanColumn);
            return;
        }

        const columnClass = Array.from(kanbanColumn.classList).find(cls => cls.startsWith('card-'));

        if (!columnClass || !COLUMN_CONFIG[columnClass]) {
            console.warn(`A coluna ${columnClass} não é uma coluna Kanban reconhecida.`);
            return;
        }

        addButton.addEventListener('click', function() {
            openModal(cardListContainer, columnClass);
        });
    }
    
    // (O restante do código para setupWorkspaceAddition é mantido igual)
    function setupWorkspaceAddition(addWorkspaceButton) {
        const workspaceCardsContainer = addWorkspaceButton.parentNode;

        if (!workspaceCardsContainer || !workspaceCardsContainer.classList.contains('workspace-cards')) {
            console.error("Container '.workspace-cards' não encontrado.");
            return;
        }

        let workspaceCounter = workspaceCardsContainer.querySelectorAll('.workspace-card-item').length + 1;

        addWorkspaceButton.addEventListener('click', function() {
            const newWorkspaceItem = document.createElement('div');
            newWorkspaceItem.classList.add('workspace-card-item');

            const workspaceText = document.createElement('p');
            workspaceText.classList.add('text-card');
            workspaceText.textContent = `Workspace ${workspaceCounter}`;

            newWorkspaceItem.appendChild(workspaceText);
            workspaceCounter++;

            workspaceCardsContainer.insertBefore(newWorkspaceItem, addWorkspaceButton);
        });
    }

    function initializeKanban() {
        // CORREÇÃO ESSENCIAL: Configura os eventos do modal UMA ÚNICA VEZ
        if (!modalEventsInitialized) {
            setupModalEvents();
        }
        
        // Inicializa os botões de adicionar cards
        const addButtons = document.querySelectorAll('.add-card-button');
        addButtons.forEach(setupCardAddition);

        // Inicializa o botão de adicionar workspace
        const addWorkspaceButton = document.querySelector('.add-workspace-button');
        if (addWorkspaceButton) {
            setupWorkspaceAddition(addWorkspaceButton);
        }

        // Torna todos os cards existentes arrastáveis
        const existingCards = document.querySelectorAll('[class*="card-item-"]');
        existingCards.forEach(card => {
            // Garante que todos os cards (existentes no HTML) tenham a classe base 'card-item'
            if (!card.classList.contains('card-item')) {
                 card.classList.add('card-item'); 
            }
            makeCardDraggable(card);
        });

        // Configura as zonas de drop em todos os containers de cards
        const cardListContainers = document.querySelectorAll('.card-list-content');
        cardListContainers.forEach(setupDropZone);
    }

    document.addEventListener('DOMContentLoaded', initializeKanban);
})();