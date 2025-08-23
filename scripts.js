// Configuração do JSONBin
const JSONBIN_BIN_ID = '68a8cfce43b1c97be925d87e '; // Substitua pelo seu bin ID
const JSONBIN_API_KEY = '$2a$10$C11qxjVyQ3LxFW2ERB0G2eYWUtsOfEWfGa4S74MGbaNY5uErGE2ZG'; // Substitua pela sua API key
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// Dados das postagens do blog (serão carregados do JSONBin)
let blogPosts = [];

// Estado global da aplicação
let appState = {
    likes: {},
    comments: {}
};

// Função para mostrar notificações
function showNotification(message, isSuccess = true) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.style.background = isSuccess ? 'var(--color-primary)' : '#f44336';
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Função para buscar dados do JSONBin
async function fetchData() {
    try {
        const response = await fetch(JSONBIN_API_URL, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar dados');
        }
        
        const data = await response.json();
        return data.record || { posts: [], likes: {}, comments: {} };
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        showNotification('Erro ao carregar dados. Usando dados locais.', false);
        return { posts: [], likes: {}, comments: {} };
    }
}

// Função para salvar dados no JSONBin
async function saveData() {
    try {
        const response = await fetch(JSONBIN_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({
                posts: blogPosts,
                likes: appState.likes,
                comments: appState.comments
            })
        });
        
        if (!response.ok) {
            throw new Error('Falha ao salvar dados');
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showNotification('Erro ao salvar dados. Os dados podem não persistir entre sessões.', false);
        return false;
    }
}

// Função para carregar os posts na página
async function loadPosts(page = 1, postsPerPage = 6) {
    const postsGrid = document.getElementById('postsGrid');
    const pagination = document.getElementById('pagination');
    
    if (!postsGrid) return;
    
    // Mostrar loading
    postsGrid.innerHTML = `
        <div class="loading-container">
            <div class="loading"></div>
            <p>Carregando posts...</p>
        </div>
    `;
    
    // Buscar dados do servidor
    const data = await fetchData();
    
    // Atualizar dados locais
    blogPosts = data.posts || [];
    appState.likes = data.likes || {};
    appState.comments = data.comments || {};
    
    // Se não houver posts, carregar posts padrão
    if (blogPosts.length === 0) {
        await loadDefaultPosts();
    }
    
    // Limpar conteúdo existente
    postsGrid.innerHTML = '';
    if (pagination) pagination.innerHTML = '';
    
    // Calcular posts para a página atual
    const startIndex = (page - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = blogPosts.slice(startIndex, endIndex);
    
    // Gerar HTML para os posts
    postsToShow.forEach(post => {
        const likes = appState.likes[post.id] || 0;
        const comments = appState.comments[post.id] || [];
        
        const postElement = document.createElement('article');
        postElement.className = 'post-card';
        postElement.innerHTML = `
            <div class="post-image">
                <img src="${post.image}" alt="${post.title}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'image-fallback\'>🌿</div>';">
            </div>
            <div class="post-content">
                <div class="post-date">${post.date}</div>
                <h2 class="post-title">${post.title}</h2>
                <p class="post-subtitle">${post.subtitle || ''}</p>
                <p class="post-excerpt">${post.excerpt}</p>
                <a href="post.html?id=${post.id}" class="read-more">Continuar lendo</a>
                <div class="post-meta">
                    <button class="like-btn" data-post-id="${post.id}">
                        <i class="far fa-heart"></i> <span class="like-count">${likes}</span>
                    </button>
                    <a href="post.html?id=${post.id}#comments" class="comments-btn">
                        <i class="far fa-comment"></i> ${comments.length}
                    </a>
                </div>
            </div>
        `;
        
        postsGrid.appendChild(postElement);
    });
    
    // Adicionar event listener para os botões de like
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = this.getAttribute('data-post-id');
            likePost(postId);
        });
    });
    
    // Gerar paginação
    if (pagination) {
        const totalPages = Math.ceil(blogPosts.length / postsPerPage);
        
        if (totalPages > 1) {
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `pagination-btn ${i === page ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                    loadPosts(i, postsPerPage);
                    window.scrollTo(0, 0);
                });
                
                pagination.appendChild(pageBtn);
            }
        }
    }
}

// Função para carregar posts padrão
async function loadDefaultPosts() {
    blogPosts = [
        
    ];
    
    // Salvar os posts no JSONBin
    await saveData();
}

// Função para curtir um post
async function likePost(postId) {
    // Atualizar estado local
    appState.likes[postId] = (appState.likes[postId] || 0) + 1;
    
    // Atualizar contador na UI
    const likeCountElement = document.querySelector(`.like-btn[data-post-id="${postId}"] .like-count`);
    if (likeCountElement) {
        likeCountElement.textContent = appState.likes[postId];
    }
    
    // Feedback visual
    const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
    if (likeBtn) {
        likeBtn.classList.add('liked');
        likeBtn.querySelector('i').className = 'fas fa-heart';
    }
    
    // Salvar no servidor
    await saveData();
    
    // Mostrar notificação
    showNotification('Obrigado pela sua curtida!');
    
    setTimeout(() => {
        if (likeBtn) likeBtn.classList.remove('liked');
    }, 1000);
}

// Função para carregar um post individual
async function loadIndividualPost() {
    const postPage = document.querySelector('.post-page');
    if (!postPage) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'));
    
    // Buscar dados do servidor
    const data = await fetchData();
    
    // Atualizar dados locais
    blogPosts = data.posts || [];
    appState.likes = data.likes || {};
    appState.comments = data.comments || {};
    
    // Se não houver posts, carregar posts padrão
    if (blogPosts.length === 0) {
        await loadDefaultPosts();
    }
    
    const post = blogPosts.find(p => p.id === postId);
    
    if (!post) {
        postPage.innerHTML = `
            <div class="container">
                <h2>Post não encontrado</h2>
                <p>O post que você está procurando não existe.</p>
                <a href="index.html">Voltar para o blog</a>
            </div>
        `;
        return;
    }
    
    const likes = appState.likes[postId] || 0;
    const comments = appState.comments[postId] || [];
    
    document.title = `${post.title} - Blog RubysVerdes`;
    
    postPage.innerHTML = `
        <article class="post-content">
            <header class="post-header">
                <h1>${post.title}</h1>
                ${post.subtitle ? `<h2 class="post-subtitle">${post.subtitle}</h2>` : ''}
                <div class="post-meta">
                    <span>${post.date}</span>
                    <span><i class="far fa-heart"></i> ${likes} curtidas</span>
                    <span><i class="far fa-comment"></i> ${comments.length} comentários</span>
                </div>
            </header>
            
            <div class="post-image" style="height: 400px; margin-bottom: 30px;">
                <img src="${post.image}" alt="${post.title}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'image-fallback\' style=\'font-size: 5rem;\'>🌿</div>';">
            </div>
            
            <div class="post-content">
                ${post.content}
            </div>
            
            <div class="post-actions">
                <button class="like-btn submit-btn" data-post-id="${postId}">
                    <i class="far fa-heart"></i> Curtir este post
                </button>
            </div>
        </article>
        
        <section class="comments-section" id="comments">
            <h3>Comentários (${comments.length})</h3>
            
            <div class="comment-form">
                <h4>Deixe seu comentário</h4>
                <form id="commentForm">
                    <div class="form-group">
                        <label for="author">Nome</label>
                        <input type="text" id="author" required>
                    </div>
                    <div class="form-group">
                        <label for="comment">Comentário</label>
                        <textarea id="comment" required></textarea>
                    </div>
                    <button type="submit" class="submit-btn">Enviar comentário</button>
                </form>
            </div>
            
            <div class="comment-list" id="commentList">
                ${comments.length > 0 ? 
                    comments.map(comment => `
                        <div class="comment">
                            <div class="comment-header">
                                <span class="comment-author">${comment.author}</span>
                                <span class="comment-date">${comment.date}</span>
                            </div>
                            <div class="comment-content">${comment.content}</div>
                        </div>
                    `).join('') : 
                    '<p>Seja o primeiro a comentar!</p>'
                }
            </div>
        </section>
    `;
    
    // Adicionar event listener para o botão de like
    const likeBtn = document.querySelector('.like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', async function() {
            // Atualizar estado local
            appState.likes[postId] = (appState.likes[postId] || 0) + 1;
            
            // Atualizar UI
            this.innerHTML = '<i class="fas fa-heart"></i> Curtido!';
            this.disabled = true;
            
            // Atualizar contador de likes
            const likeCountElement = document.querySelector('.post-meta span:nth-child(2)');
            if (likeCountElement) {
                likeCountElement.innerHTML = `<i class="far fa-heart"></i> ${appState.likes[postId]} curtidas`;
            }
            
            // Salvar no servidor
            await saveData();
            
            // Mostrar notificação
            showNotification('Obrigado pela sua curtida!');
        });
    }
    
    // Adicionar event listener para o formulário de comentários
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const author = document.getElementById('author').value;
            const content = document.getElementById('comment').value;
            
            if (author && content) {
                await addComment(postId, author, content);
                commentForm.reset();
            }
        });
    }
}

// Função para adicionar um comentário
async function addComment(postId, author, content) {
    // Inicializar array de comentários se não existir
    if (!appState.comments[postId]) {
        appState.comments[postId] = [];
    }
    
    const newComment = {
        id: Date.now(),
        author: author,
        content: content,
        date: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    // Adicionar ao estado local
    appState.comments[postId].unshift(newComment);
    
    // Atualizar a lista de comentários na UI
    const commentList = document.getElementById('commentList');
    if (commentList) {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${newComment.author}</span>
                <span class="comment-date">${newComment.date}</span>
            </div>
            <div class="comment-content">${newComment.content}</div>
        `;
        
        if (commentList.firstChild && commentList.firstChild.tagName === 'P') {
            commentList.innerHTML = '';
        }
        
        commentList.prepend(commentElement);
    }
    
    // Atualizar contador de comentários
    const commentsTitle = document.querySelector('.comments-section h3');
    if (commentsTitle) {
        const commentCount = appState.comments[postId].length;
        commentsTitle.textContent = `Comentários (${commentCount})`;
    }
    
    // Atualizar contador de comentários no post-meta
    const commentCountElement = document.querySelector('.post-meta span:nth-child(3)');
    if (commentCountElement) {
        const commentCount = appState.comments[postId].length;
        commentCountElement.innerHTML = `<i class="far fa-comment"></i> ${commentCount} comentários`;
    }
    
    // Salvar no servidor
    await saveData();
    
    // Mostrar notificação
    showNotification('Comentário adicionado com sucesso!');
}

// Função para carregar a página de administração
async function loadAdminPage() {
    const commentsList = document.getElementById('commentsList');
    const exportBtn = document.getElementById('exportBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    if (!commentsList) return;
    
    // Buscar dados do servidor
    const data = await fetchData();
    
    // Atualizar dados locais
    appState.likes = data.likes || {};
    appState.comments = data.comments || {};
    
    // Carregar todos os comentários
    async function loadAllComments() {
        commentsList.innerHTML = '<p>Carregando comentários...</p>';
        
        // Coletar todos os comentários de todos os posts
        let allComments = [];
        for (const postId in appState.comments) {
            if (appState.comments.hasOwnProperty(postId)) {
                const postComments = appState.comments[postId];
                
                postComments.forEach(comment => {
                    allComments.push({
                        ...comment,
                        postId: postId
                    });
                });
            }
        }
        
        // Ordenar por data (mais recentes primeiro)
        allComments.sort((a, b) => b.id - a.id);
        
        // Exibir comentários
        if (allComments.length === 0) {
            commentsList.innerHTML = '<p>Nenhum comentário encontrado.</p>';
            return;
        }
        
        commentsList.innerHTML = '';
        allComments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment admin-comment';
            commentElement.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${comment.date}</span>
                    <span class="comment-post">Post: ${comment.postId}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
                <div class="comment-actions">
                    <button class="delete-comment" data-post-id="${comment.postId}" data-comment-id="${comment.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            `;
            
            commentsList.appendChild(commentElement);
        });
        
        // Adicionar event listeners para os botões de exclusão
        document.querySelectorAll('.delete-comment').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.getAttribute('data-post-id');
                const commentId = parseInt(this.getAttribute('data-comment-id'));
                deleteComment(postId, commentId);
            });
        });
    }
    
    // Excluir um comentário específico
    async function deleteComment(postId, commentId) {
        if (appState.comments[postId]) {
            const updatedComments = appState.comments[postId].filter(comment => comment.id !== commentId);
            appState.comments[postId] = updatedComments;
            
            // Salvar no servidor
            await saveData();
            
            // Recarregar a lista
            await loadAllComments();
            
            // Mostrar notificação
            showNotification('Comentário excluído com sucesso!');
        }
    }
    
    // Exportar comentários
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            let allComments = [];
            for (const postId in appState.comments) {
                if (appState.comments.hasOwnProperty(postId)) {
                    const postComments = appState.comments[postId];
                    
                    postComments.forEach(comment => {
                        allComments.push({
                            ...comment,
                            postId: postId
                        });
                    });
                }
            }
            
            const dataStr = JSON.stringify(allComments, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'comentarios-rubysverdes.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        });
    }
    
    // Limpar todos os comentários
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async function() {
            if (confirm('Tem certeza que deseja excluir TODOS os comentários? Esta ação não pode ser desfeita.')) {
                appState.comments = {};
                
                // Salvar no servidor
                await saveData();
                
                // Recarregar a lista
                await loadAllComments();
                
                // Mostrar notificação
                showNotification('Todos os comentários foram excluídos!');
            }
        });
    }
    
    // Carregar comentários ao inicializar
    await loadAllComments();
}