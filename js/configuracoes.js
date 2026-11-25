/* ==========================================================
   CONFIGURAÇÕES (TEMA, PRIVACIDADE, BACKUP, CSV, CATEGORIAS E PAGAMENTOS)
========================================================== */

/* --- TEMA ESCURO --- */
const botaoTema = document.getElementById("toggleThemeConfig");
const textoTema = botaoTema ? botaoTema.querySelector("span") : null;

if (botaoTema) {
    botaoTema.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        if (document.body.classList.contains("dark")) {
            localStorage.setItem("tema", "dark");
            if (textoTema) textoTema.innerText = "☀️ Tema claro";
        } else {
            localStorage.setItem("tema", "light");
            if (textoTema) textoTema.innerText = "🌙 Tema Escuro";
        }
    });
}

if (localStorage.getItem("tema") === "dark") {
    document.body.classList.add("dark");
    if (textoTema) {
        textoTema.innerText = "☀️ Tema claro";
    }
}

/* --- MODO PRIVACIDADE (OLHINHO) --- */
function atualizarBotaoPrivacidade() {
    const btn = document.getElementById("btnPrivacidade");
    if (!btn) return;

    const oculto = document.body.classList.contains("valoresOcultos");
    btn.innerText = oculto ? "🙈" : "👁️";
    btn.title = oculto ? "Mostrar valores" : "Ocultar valores";
}

function alternarPrivacidade() {
    document.body.classList.toggle("valoresOcultos");
    const oculto = document.body.classList.contains("valoresOcultos");
    localStorage.setItem("ocultarValores", oculto ? "sim" : "nao");
    atualizarBotaoPrivacidade();
}

if (localStorage.getItem("ocultarValores") === "sim") {
    document.body.classList.add("valoresOcultos");
    atualizarBotaoPrivacidade();
}

/* --- BACKUP E RESTAURAÇÃO --- */
const botaoBackup = document.getElementById("btnBackup");

if (botaoBackup) {
    botaoBackup.addEventListener("click", () => {
        const dados = carregarDados();
        const metas = carregarMetas();
        const recorrencias = carregarRecorrencias();
        const categorias = carregarCategorias();
        const formasPagamento = carregarFormasPagamento();

        const arquivo = JSON.stringify(
            {
                lancamentos: dados,
                metas: metas,
                recorrencias: recorrencias,
                categorias: categorias,
                formasPagamento: formasPagamento
            },
            null,
            2
        );

        const blob = new Blob([arquivo], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "backup_controle_financeiro.json";
        link.click();

        URL.revokeObjectURL(url);

        localStorage.setItem("ultimo_backup_controle", String(Date.now()));
        verificarLembreteBackup();
    });
}

const botaoRestaurar = document.getElementById("btnRestaurar");
const arquivoBackup = document.getElementById("arquivoBackup");

if (botaoRestaurar) {
    botaoRestaurar.addEventListener("click", () => {
        arquivoBackup.click();
    });
}

if (arquivoBackup) {
    arquivoBackup.addEventListener("change", (evento) => {
        const arquivo = evento.target.files[0];
        if (!arquivo) return;

        const leitor = new FileReader();

        leitor.onload = function(e) {
            try {
                const dados = JSON.parse(e.target.result);

                if (Array.isArray(dados)) {
                    salvarDados(dados);
                } else {
                    salvarDados(dados.lancamentos || []);
                    salvarMetas(dados.metas || []);
                    salvarRecorrencias(dados.recorrencias || []);

                    if (Array.isArray(dados.categorias)) {
                        salvarCategorias(dados.categorias);
                        atualizarCategoriasLancamento();
                    }
                    if (Array.isArray(dados.formasPagamento)) {
                        salvarFormasPagamento(dados.formasPagamento);
                        atualizarFormasPagamentoLancamento();
                    }
                }

                abrirModalAviso("Backup restaurado com sucesso!", "✅ Sucesso");
                localStorage.setItem("ultimo_backup_controle", String(Date.now()));
                verificarLembreteBackup();
                atualizarInicio();
                renderizar();
            } catch {
                abrirModalAviso("Arquivo de backup inválido!", "❌ Erro");
            }
        };

        leitor.readAsText(arquivo);
    });
}

/* --- EXPORTAR PLANILHA (CSV) --- */
function exportarCSV() {
    const dados = carregarDados();

    if (!dados.length) {
        abrirModalAviso("Não há lançamentos para exportar ainda.");
        return;
    }

    const escaparCSV = (texto) => {
        const limpo = String(texto ?? "").replace(/\r?\n/g, " ");
        return `"${limpo.replace(/"/g, '""')}"`;
    };

    const cabecalho = [
        "Data",
        "Descrição",
        "Tipo",
        "Categoria",
        "Forma de Pagamento",
        "Parcela",
        "Valor (R$)",
        "Status",
        "Observação"
    ].join(";");

    const ordenados = [...dados].sort(
        (a, b) => new Date(b.data) - new Date(a.data)
    );

    const linhas = ordenados.map(item => {
        const dataBr = new Date(item.data).toLocaleDateString("pt-BR");
        const tipoTexto = item.tipo === "receita" ? "Receita" : "Despesa";
        const statusTexto = item.status === "pago" ? "Pago" : "Pendente";
        const valorFormatado = Number(item.valor).toFixed(2).replace(".", ",");

        return [
            escaparCSV(dataBr),
            escaparCSV(item.descricao),
            escaparCSV(tipoTexto),
            escaparCSV(item.categoria || "Sem categoria"),
            escaparCSV(item.formaPagamento || "Não informado"),
            escaparCSV(item.parcela || (item.recorrente ? "Recorrente" : "-")),
            escaparCSV(valorFormatado),
            escaparCSV(statusTexto),
            escaparCSV(item.observacao || "")
        ].join(";");
    });

    const conteudoCSV = "\uFEFF" + [cabecalho, ...linhas].join("\n");
    const blob = new Blob([conteudoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `controle_financeiro_${dataHojeLocal()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
}

/* --- CATEGORIAS --- */
function renderizarCategorias() {
    const lista = document.getElementById("listaCategorias");
    if (!lista) return;

    const categorias = carregarCategorias();
    lista.innerHTML = "";

    categorias.forEach((categoria, index) => {
        const div = document.createElement("div");
        div.className = "card";

        const limiteHtml =
            categoria.limite && Number(categoria.limite) > 0
                ? `<small class="limiteCategoriaInfo">🎯 Limite: R$ ${moeda(categoria.limite)}/mês</small>`
                : "";

        div.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <span style="min-width:0;flex:1;">
                    <strong style="display:block;">${categoria.icone} ${categoria.nome}</strong>
                    ${limiteHtml}
                </span>
                <div style="display:flex;gap:6px;">
                    <button class="btnEditar" onclick="editarCategoria(${index})">✏️</button>
                    <button class="btnExcluir" onclick="excluirCategoria(${index})">🗑️</button>
                </div>
            </div>
        `;

        lista.appendChild(div);
    });
}

async function adicionarCategoria() {
    const resposta = await abrirModalFormulario({
        titulo: "🏷️ Nova categoria",
        campos: [
            {
                id: "nome",
                label: "Nome da categoria",
                placeholder: "Ex: Educação",
                maxLength: LIMITES_TEXTO.categoria
            },
            {
                id: "icone",
                label: "Emoji (opcional)",
                placeholder: "Ex: 📚",
                maxLength: LIMITES_TEXTO.emoji
            },
            {
                id: "limite",
                label: "Limite mensal R$ (opcional)",
                placeholder: "Ex: 500,00",
                inputmode: "decimal"
            }
        ],
        textoConfirmar: "Salvar"
    });

    if (!resposta) return;

    if (!resposta.nome || !resposta.nome.trim()) {
        abrirModalAviso("Digite o nome da categoria.");
        return;
    }

    let limite = 0;
    const limiteTexto = (resposta.limite || "").trim();
    if (limiteTexto !== "") {
        limite = Number(limiteTexto.replace(/\./g, "").replace(",", "."));
        if (!Number.isFinite(limite) || limite < 0) {
            abrirModalAviso("Digite um valor de limite válido (ou deixe em branco).");
            return;
        }
    }

    const categorias = carregarCategorias();
    categorias.push({
        nome: resposta.nome.trim(),
        icone: (resposta.icone || "").trim(),
        limite: limite
    });

    salvarCategorias(categorias);
    renderizarCategorias();
    atualizarCategoriasLancamento();
}

async function editarCategoria(index) {
    const categorias = carregarCategorias();
    const categoria = categorias[index];
    const nomeAntigo = categoria.nome;

    const resposta = await abrirModalFormulario({
        titulo: "✏️ Editar categoria",
        campos: [
            {
                id: "nome",
                label: "Nome da categoria",
                valorInicial: nomeAntigo,
                maxLength: LIMITES_TEXTO.categoria
            },
            {
                id: "icone",
                label: "Emoji (opcional)",
                valorInicial: categoria.icone || "",
                maxLength: LIMITES_TEXTO.emoji
            },
            {
                id: "limite",
                label: "Limite mensal R$ (opcional)",
                placeholder: "Deixe vazio para sem limite",
                valorInicial: categoria.limite && Number(categoria.limite) > 0 ? moeda(categoria.limite) : "",
                inputmode: "decimal"
            }
        ],
        textoConfirmar: "Atualizar"
    });

    if (!resposta) return;

    if (!resposta.nome || !resposta.nome.trim()) {
        abrirModalAviso("Digite o nome da categoria.");
        return;
    }

    let limite = 0;
    const limiteTexto = (resposta.limite || "").trim();
    if (limiteTexto !== "") {
        limite = Number(limiteTexto.replace(/\./g, "").replace(",", "."));
        if (!Number.isFinite(limite) || limite < 0) {
            abrirModalAviso("Digite um valor de limite válido (ou deixe em branco).");
            return;
        }
    }

    const nomeNovo = resposta.nome.trim();
    categoria.nome = nomeNovo;
    categoria.icone = (resposta.icone || "").trim();
    categoria.limite = limite;

    salvarCategorias(categorias);

    const dados = carregarDados();
    dados.forEach(item => {
        if (item.categoria === nomeAntigo) {
            item.categoria = nomeNovo;
        }
    });
    salvarDados(dados);

    renderizarCategorias();
    atualizarCategoriasLancamento();
    atualizarInicio();
    renderizar();
}

async function excluirCategoria(index) {
    const categorias = carregarCategorias();
    const categoria = categorias[index];
    const dados = carregarDados();

    const quantidade = dados.filter(
        item => item.categoria === categoria.nome
    ).length;

    if (quantidade === 0) {
        const confirmar = await abrirModalOpcoes({
            titulo: "🗑️ Excluir categoria",
            texto: `Deseja excluir a categoria "${categoria.nome}"?`,
            opcoes: [
                { valor: "sim", texto: "🗑️ Excluir categoria", perigo: true }
            ]
        });

        if (!confirmar) return;

        categorias.splice(index, 1);
        salvarCategorias(categorias);
        renderizarCategorias();
        atualizarCategoriasLancamento();
        return;
    }

    const opcao = await abrirModalOpcoes({
        titulo: "🗑️ Excluir categoria",
        texto: `A categoria "${categoria.nome}" possui ${quantidade} lançamento(s). O que deseja fazer com eles?`,
        opcoes: [
            { valor: "1", texto: "Transferir para outra categoria" },
            { valor: "2", texto: "Manter os lançamentos sem categoria" }
        ]
    });

    if (!opcao) return;

    if (opcao === "1") {
        const outrasCategorias = categorias.filter((_, i) => i !== index);

        if (outrasCategorias.length === 0) {
            abrirModalAviso("Não existe outra categoria para transferir os lançamentos.");
            return;
        }

        const escolhaNome = await abrirModalOpcoes({
            titulo: "🏷️ Escolher nova categoria",
            texto: "Para qual categoria deseja transferir os lançamentos?",
            opcoes: outrasCategorias.map(cat => ({
                valor: cat.nome,
                texto: `${cat.icone ? cat.icone + " " : ""}${cat.nome}`
            }))
        });

        if (!escolhaNome) return;

        dados.forEach(item => {
            if (item.categoria === categoria.nome) {
                item.categoria = escolhaNome;
            }
        });
        salvarDados(dados);
    }

    if (opcao === "2") {
        dados.forEach(item => {
            if (item.categoria === categoria.nome) {
                item.categoria = "";
            }
        });
        salvarDados(dados);
    }

    categorias.splice(index, 1);
    salvarCategorias(categorias);
    renderizarCategorias();
    atualizarCategoriasLancamento();
    atualizarInicio();
    renderizar();
}

function atualizarCategoriasLancamento() {
    const select = document.getElementById("categoria");
    if (!select) return;

    const valorAtual = select.value;
    const categorias = carregarCategorias();

    select.innerHTML =
        '<option value="" selected disabled>Selecione...</option>';

    categorias.forEach(categoria => {
        const option = document.createElement("option");
        option.value = categoria.nome;
        option.textContent = `${categoria.icone ? categoria.icone + " " : ""}${categoria.nome}`;
        select.appendChild(option);
    });

    if (categorias.some(c => c.nome === valorAtual)) {
        select.value = valorAtual;
    }
}

/* --- FORMAS DE PAGAMENTO --- */
function atualizarFormasPagamentoLancamento() {
    const select = document.getElementById("formaPagamento");
    if (!select) return;

    const valorAtual = select.value;
    const formas = carregarFormasPagamento();

    select.innerHTML =
        '<option value="" selected disabled>Selecione...</option>';

    formas.forEach(forma => {
        const option = document.createElement("option");
        option.value = forma.nome;
        option.textContent = `${forma.icone ? forma.icone + " " : ""}${forma.nome}`;
        select.appendChild(option);
    });

    if (formas.some(forma => forma.nome === valorAtual)) {
        select.value = valorAtual;
    }
}

function renderizarFormasPagamento() {
    const lista = document.getElementById("listaFormasPagamento");
    if (!lista) return;

    const formas = carregarFormasPagamento();
    lista.innerHTML = "";

    formas.forEach((forma, index) => {
        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <strong>${forma.icone} ${forma.nome}</strong>
                <div style="display:flex;gap:6px;">
                    <button class="btnEditar" onclick="editarFormaPagamento(${index})">✏️</button>
                    <button class="btnExcluir" onclick="excluirFormaPagamento(${index})">🗑️</button>
                </div>
            </div>
        `;

        lista.appendChild(div);
    });
}

async function adicionarFormaPagamento() {
    const resposta = await abrirModalFormulario({
        titulo: "💳 Nova forma de pagamento",
        campos: [
            {
                id: "nome",
                label: "Nome da forma de pagamento",
                placeholder: "Ex: Pix",
                maxLength: LIMITES_TEXTO.formaPagamento
            },
            {
                id: "icone",
                label: "Emoji (opcional)",
                placeholder: "Ex: ⚡",
                maxLength: LIMITES_TEXTO.emoji
            }
        ],
        textoConfirmar: "Salvar"
    });

    if (!resposta) return;

    if (!resposta.nome || !resposta.nome.trim()) {
        abrirModalAviso("Digite o nome da forma de pagamento.");
        return;
    }

    const formas = carregarFormasPagamento();
    formas.push({
        nome: resposta.nome.trim(),
        icone: (resposta.icone || "").trim()
    });

    salvarFormasPagamento(formas);
    renderizarFormasPagamento();
    atualizarFormasPagamentoLancamento();
}

async function editarFormaPagamento(index) {
    const formas = carregarFormasPagamento();
    const forma = formas[index];
    const nomeAntigo = forma.nome;

    const resposta = await abrirModalFormulario({
        titulo: "✏️ Editar forma de pagamento",
        campos: [
            {
                id: "nome",
                label: "Nome da forma de pagamento",
                valorInicial: nomeAntigo,
                maxLength: LIMITES_TEXTO.formaPagamento
            },
            {
                id: "icone",
                label: "Emoji (opcional)",
                valorInicial: forma.icone || "",
                maxLength: LIMITES_TEXTO.emoji
            }
        ],
        textoConfirmar: "Atualizar"
    });

    if (!resposta) return;

    if (!resposta.nome || !resposta.nome.trim()) {
        abrirModalAviso("Digite o nome da forma de pagamento.");
        return;
    }

    const nomeNovo = resposta.nome.trim();
    forma.nome = nomeNovo;
    forma.icone = (resposta.icone || "").trim();

    salvarFormasPagamento(formas);

    const dados = carregarDados();
    dados.forEach(item => {
        if (item.formaPagamento === nomeAntigo) {
            item.formaPagamento = nomeNovo;
        }
    });
    salvarDados(dados);

    renderizarFormasPagamento();
    atualizarFormasPagamentoLancamento();
    atualizarInicio();
    renderizar();
}

async function excluirFormaPagamento(index) {
    const formas = carregarFormasPagamento();
    const forma = formas[index];
    const dados = carregarDados();

    const quantidade = dados.filter(
        item => item.formaPagamento === forma.nome
    ).length;

    if (quantidade === 0) {
        const confirmar = await abrirModalOpcoes({
            titulo: "🗑️ Excluir forma de pagamento",
            texto: `Deseja excluir "${forma.nome}"?`,
            opcoes: [
                { valor: "sim", texto: "🗑️ Excluir forma de pagamento", perigo: true }
            ]
        });

        if (!confirmar) return;

        formas.splice(index, 1);
        salvarFormasPagamento(formas);
        renderizarFormasPagamento();
        atualizarFormasPagamentoLancamento();
        return;
    }

    const opcao = await abrirModalOpcoes({
        titulo: "🗑️ Excluir forma de pagamento",
        texto: `A forma "${forma.nome}" possui ${quantidade} lançamento(s). O que deseja fazer com eles?`,
        opcoes: [
            { valor: "1", texto: "Transferir para outra forma" },
            { valor: "2", texto: "Deixar os lançamentos sem forma" }
        ]
    });

    if (!opcao) return;

    if (opcao === "1") {
        const outrasFormas = formas.filter((_, i) => i !== index);

        if (outrasFormas.length === 0) {
            abrirModalAviso("Não existe outra forma para transferir os lançamentos.");
            return;
        }

        const escolhaNome = await abrirModalOpcoes({
            titulo: "💳 Escolher nova forma",
            texto: "Para qual forma de pagamento deseja transferir os lançamentos?",
            opcoes: outrasFormas.map(f => ({
                valor: f.nome,
                texto: `${f.icone ? f.icone + " " : ""}${f.nome}`
            }))
        });

        if (!escolhaNome) return;

        dados.forEach(item => {
            if (item.formaPagamento === forma.nome) {
                item.formaPagamento = escolhaNome;
            }
        });
        salvarDados(dados);
    }

    if (opcao === "2") {
        dados.forEach(item => {
            if (item.formaPagamento === forma.nome) {
                item.formaPagamento = "";
            }
        });
        salvarDados(dados);
    }

    formas.splice(index, 1);
    salvarFormasPagamento(formas);
    renderizarFormasPagamento();
    atualizarFormasPagamentoLancamento();
    atualizarInicio();
    renderizar();
}