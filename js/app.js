/* ==========================================================
   CONTROLE FINANCEIRO
   APP PRINCIPAL
========================================================== */

/* ==========================================================
   CONFIGURAÇÕES
========================================================== */

const STORAGE = "controle_financeiro";
let idEdicao = null;
let mesInicioAtual = "";

const STORAGE_RECORRENTES = "controle_recorrencias";

/* Limite máximo de caracteres dos campos (altere só os números se quiser ajustar) */
const LIMITES_TEXTO = {
    categoria: 25,
    formaPagamento: 25,
    meta: 40,
    descricao: 50,
    observacao: 100,
    emoji: 6
};

const MSG_EXCLUIR_REGISTRO =
    "Deseja excluir este registro?";

const MSG_EXCLUIR_GRUPO =
    "Deseja excluir todas as parcelas deste lançamento?";

/* ==========================================================
   ELEMENTOS DA INTERFACE
========================================================== */

const form = document.getElementById("form");
const lista = document.getElementById("lista");
const parcelado = document.getElementById("parcelado");
const areaParcelas = document.getElementById("areaParcelas");
const filtroMes = document.getElementById("filtroMes");
const buscar = document.getElementById("buscar");
const ordenacao = document.getElementById("ordenacao");

const inputDescricao = document.getElementById("descricao");
const inputValor = document.getElementById("valor");
const inputDataLancamento = document.getElementById("dataLancamento");
const selectTipo = document.getElementById("tipo");
const selectCategoria = document.getElementById("categoria");
const inputObservacao = document.getElementById("observacao");
const inputParcelas = document.getElementById("parcelas");
const selectFormaPagamento = document.getElementById("formaPagamento");

const totalDespesasMes = document.getElementById("totalDespesasMes");
const totalPendenteMes = document.getElementById("totalPendenteMes");
const totalReceitasMes = document.getElementById("totalReceitasMes");
const saldoMes = document.getElementById("saldoMes");

const saldoInicio = document.getElementById("saldoInicio");
const receitasInicio = document.getElementById("receitasInicio");
const despesasInicio = document.getElementById("despesasInicio");
const pendenciasInicio = document.getElementById("pendenciasInicio");
const mesAtualInicio = document.getElementById("mesAtualInicio");
const quantidadeInicio = document.getElementById("quantidadeInicio");

const gastosMes = document.getElementById("gastosMes");
const receitasMes = document.getElementById("receitasMes");
const resultadoMes = document.getElementById("resultadoMes");
const maiorGasto = document.getElementById("maiorGasto");
const campoValor = document.getElementById("valor");

function calcularExpressao(valor) {
    let expressao = String(valor)
        .replace(/(\d)\.(?=\d{3}(?:[.,]|$))/g, "$1")
        .replace(/,/g, ".")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/\s/g, "");

    if (!/^[0-9.+\-*/()]+$/.test(expressao)) {
        return null;
    }

    try {
        const resultado = Function(
            '"use strict"; return (' + expressao + ')'
        )();

        if (!Number.isFinite(resultado)) {
            return null;
        }

        return Number(resultado.toFixed(2));
    } catch (erro) {
        return null;
    }
}

/* ==========================================================
   EVENTOS
========================================================== */

filtroMes.addEventListener("change", () => {
    atualizarMesExibido();
    gerarRecorrenciasDoMes();
    renderizar();
});

function atualizarMesExibido() {
    if (!filtroMes.value) return;

    const [ano, mes] = filtroMes.value.split("-");
    const data = new Date(Number(ano), Number(mes) - 1, 1);

    const nomeMes = data.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    });

    const mesExibido = document.getElementById("mesExibido");

    if (mesExibido) {
        mesExibido.innerText =
            nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
    }
}

function mudarMes(direcao) {
    if (!filtroMes.value) return;

    const [ano, mes] = filtroMes.value.split("-").map(Number);
    const data = new Date(ano, mes - 1, 1);

    data.setMonth(data.getMonth() + direcao);

    const novoAno = data.getFullYear();
    const novoMes = String(data.getMonth() + 1).padStart(2, "0");

    filtroMes.value = `${novoAno}-${novoMes}`;

    atualizarMesExibido();
    gerarRecorrenciasDoMes();
    renderizar();
}

buscar.addEventListener("input", renderizar);
ordenacao.addEventListener("change", renderizar);

parcelado.addEventListener("change", () => {
    if (parcelado.value === "sim") {
        areaParcelas.style.display = "block";
    } else {
        areaParcelas.style.display = "none";
    }
});

/* ==========================================================
   BANCO DE DADOS LOCAL
========================================================== */

function carregarDados() {
    return JSON.parse(localStorage.getItem(STORAGE) || "[]");
}

function salvarDados(dados) {
    localStorage.setItem(STORAGE, JSON.stringify(dados));
}

function carregarRecorrencias() {
    return JSON.parse(localStorage.getItem(STORAGE_RECORRENTES) || "[]");
}

function salvarRecorrencias(recorrencias) {
    localStorage.setItem(
        STORAGE_RECORRENTES,
        JSON.stringify(recorrencias)
    );
}

function gerarRecorrenciasDoMes(mesAlvo = null) {
    const recorrencias = carregarRecorrencias();
    const dados = carregarDados();

    if (!recorrencias.length) return;
    const mesReferencia = mesAlvo || (filtroMes ? filtroMes.value : "");
    if (!mesReferencia) return;

    const [ano, mesNumero] = mesReferencia.split("-").map(Number);

    let alterou = false;

    recorrencias.forEach(recorrencia => {
        const inicio = new Date(recorrencia.inicio);
        const inicioAno = inicio.getFullYear();
        const inicioMes = inicio.getMonth();

        if (ano < inicioAno || (ano === inicioAno && mes < inicioMes)) {
            return;
        }

        const chaveMes = `${ano}-${String(mes + 1).padStart(2, "0")}`;

        if (recorrencia.excluidos && recorrencia.excluidos.includes(chaveMes)) {
            return;
        }

        if (recorrencia.fim && chaveMes > recorrencia.fim) {
            return;
        }

        const jaExiste = dados.some(item => {
            if (item.recorrenciaId !== recorrencia.id) {
                return false;
            }
            const dataItem = new Date(item.data);
            return (
                dataItem.getFullYear() === ano &&
                dataItem.getMonth() === mes
            );
        });

        if (jaExiste) return;

        const ultimoDia = new Date(ano, mes + 1, 0).getDate();
        const dia = Math.min(recorrencia.dia, ultimoDia);
        const dataRecorrencia = new Date(ano, mes, dia, 12, 0, 0);

        dados.push({
            id: String(gerarID()),
            grupo: recorrencia.id,
            recorrenciaId: recorrencia.id,
            recorrente: true,
            descricao: recorrencia.descricao,
            valor: recorrencia.valor,
            tipo: recorrencia.tipo,
            categoria: recorrencia.categoria,
            formaPagamento: recorrencia.formaPagamento,
            observacao: recorrencia.observacao,
            parcela: "",
            status: "pendente",
            data: dataRecorrencia.toISOString()
        });

        alterou = true;
    });

    if (alterou) {
        salvarDados(dados);
    }
}

function gerarID() {
    return Date.now() + Math.random();
}

/* ==========================================================
   FUNÇÕES AUXILIARES
========================================================== */

function dataHojeLocal() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
    const dataObj = new Date(data);
    return (
        dataObj.toLocaleDateString("pt-BR") +
        " " +
        dataObj.toLocaleTimeString("pt-BR")
    );
}

function encontrarRegistro(dados, id) {
    return dados.find(item => String(item.id) === String(id));
}

function editarRegistro(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);

    if (!registro) {
        return;
    }

    inputDescricao.value = registro.descricao;
    expressaoCalc = String(registro.valor).replace(".", ",");
    inputValor.value = expressaoCalc;
    atualizarTeclado();

    inputDataLancamento.value = registro.data.split("T")[0];
    selectTipo.value = registro.tipo;
    selectCategoria.value = registro.categoria;
    inputObservacao.value = registro.observacao || "";
    selectFormaPagamento.value = registro.formaPagamento || "";

    parcelado.disabled = true;

    if (registro.recorrente) {
        parcelado.value = "recorrente";
        areaParcelas.style.display = "none";
        inputParcelas.disabled = true;
    } else if (registro.parcela) {
        const partesParcela = registro.parcela.split("/");
        const quantidadeParcelas = Number(partesParcela[1]);

        parcelado.value = "sim";
        areaParcelas.style.display = "block";
        inputParcelas.value = quantidadeParcelas;
        inputParcelas.disabled = true;
    } else {
        parcelado.value = "nao";
        areaParcelas.style.display = "none";
        inputParcelas.disabled = true;
    }

    idEdicao = id;
    document.querySelector(".btnSalvar").innerText = "Atualizar Registro";

    const botaoCancelar = document.getElementById("btnCancelarEdicao");
    if (botaoCancelar) {
        botaoCancelar.style.display = "inline-block";
    }

    const avisoEdicao = document.getElementById("avisoEdicao");
    if (avisoEdicao) {
        avisoEdicao.innerText = registro.parcela
            ? `✏️ Editando: ${registro.descricao} — Parcela ${registro.parcela}`
            : `✏️ Editando: ${registro.descricao}`;
        avisoEdicao.style.display = "block";
    }

    mostrarTela("telaLancamentos");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function duplicarRegistro(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);
    if (!registro) return;

    limparFormulario();

    inputDescricao.value = registro.descricao || "";
    expressaoCalc = String(registro.valor).replace(".", ",");
    inputValor.value = expressaoCalc;
    atualizarTeclado();

    inputDataLancamento.value = dataHojeLocal();
    selectTipo.value = registro.tipo || "";
    selectCategoria.value = registro.categoria || "";
    selectFormaPagamento.value = registro.formaPagamento || "";
    inputObservacao.value = registro.observacao || "";
    parcelado.value = "nao";
    areaParcelas.style.display = "none";

    document.querySelectorAll(".menuAcoes").forEach(menu => {
        menu.classList.remove("aberto");
    });

    mostrarTela("telaLancamentos");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function verObservacao(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);
    if (!registro || !registro.observacao) return;

    abrirModalAviso(registro.observacao, "📝 Observação");
}

function moeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function toggleMenu(id) {
    document.querySelectorAll(".menuAcoes").forEach(menu => {
        if (menu.id !== "menu-" + id) {
            menu.classList.remove("aberto");
        }
    });

    document.getElementById("menu-" + id).classList.toggle("aberto");
}

document.addEventListener("click", function(e) {
    if (!e.target.closest(".acoesTransacao")) {
        document.querySelectorAll(".menuAcoes").forEach(menu => {
            menu.classList.remove("aberto");
        });
    }
});

/* ==========================================================
   CADASTRO DE MOVIMENTAÇÃO
========================================================== */

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const descricao = inputDescricao.value.trim();
    const valor = calcularExpressao(inputValor.value);

    if (valor === null || valor <= 0) {
        abrirModalAviso("Digite um valor ou uma conta válida.");
        return;
    }

    const tipo = selectTipo.value;
    const categoria = selectCategoria.value;
    const observacao = inputObservacao.value.trim();
    const formaPagamento = selectFormaPagamento.value;

    if (!tipo) {
        abrirModalAviso("Selecione o tipo (Despesa ou Receita).");
        return;
    }

    if (!categoria) {
        abrirModalAviso("Selecione uma categoria.");
        return;
    }

    if (!parcelado.value) {
        abrirModalAviso("Selecione a opção de repetição.");
        return;
    }

    if (!idEdicao && parcelado.value === "sim" && (!inputParcelas.value || Number(inputParcelas.value) < 2)) {
        abrirModalAviso("Digite uma quantidade de parcelas válida (mínimo 2).");
        return;
    }

    const dataEscolhida = inputDataLancamento.value;
    const agora = dataEscolhida
        ? new Date(dataEscolhida + "T12:00:00")
        : new Date();

    const dados = carregarDados();

    /* =====================================================
       EDIÇÃO DE LANÇAMENTO
    ===================================================== */

    if (idEdicao) {
        const registro = encontrarRegistro(dados, idEdicao);
        if (!registro) return;

        const grupoOriginal = registro.grupo;
        const dataOriginal = new Date(registro.data);
        const dataOriginalInput = registro.data.split("T")[0];
        const dataFoiAlterada = dataEscolhida !== dataOriginalInput;

        const parcelasGrupo = dados
            .filter(item => item.grupo === grupoOriginal)
            .sort((a, b) => new Date(a.data) - new Date(b.data));

        let opcao;

        if (registro.recorrente) {
            opcao = await abrirModalOpcoes({
                titulo: "✏️ Editar recorrência",
                texto: "Este lançamento faz parte de uma recorrência. Como deseja aplicar a alteração?",
                opcoes: [
                    { valor: "1", texto: "1 - Editar somente este mês" },
                    { valor: "2", texto: "2 - Editar este mês e os próximos" },
                    { valor: "3", texto: "3 - Editar toda a recorrência" }
                ]
            });

            if (!opcao) return;
        } else if (registro.parcela) {
            opcao = await abrirModalOpcoes({
                titulo: "✏️ Editar parcelamento",
                texto: "Como deseja aplicar a alteração?",
                opcoes: [
                    { valor: "1", texto: "1 - Editar somente esta parcela" },
                    { valor: "2", texto: "2 - Editar esta e as futuras" },
                    { valor: "3", texto: "3 - Editar todas as parcelas" }
                ]
            });

            if (!opcao) return;
        } else {
            opcao = "esta";
        }

        function aplicarAlteracoes(item, novaData, manterDataOriginal = false) {
            item.descricao = descricao;
            item.valor = valor;
            item.tipo = tipo;
            item.categoria = categoria;
            item.formaPagamento = formaPagamento;
            item.observacao = observacao;

            if (!manterDataOriginal) {
                item.data = novaData.toISOString();
            }
        }

        if (registro.recorrente && opcao === "1") {
            aplicarAlteracoes(registro, agora, !dataFoiAlterada);
        } else if (registro.recorrente && opcao === "2") {
            aplicarAlteracoes(registro, agora, !dataFoiAlterada);

            const recorrencias = carregarRecorrencias();
            const recorrencia = recorrencias.find(
                item => String(item.id) === String(registro.recorrenciaId)
            );

            if (recorrencia) {
                recorrencia.descricao = descricao;
                recorrencia.valor = valor;
                recorrencia.tipo = tipo;
                recorrencia.categoria = categoria;
                recorrencia.formaPagamento = formaPagamento;
                recorrencia.observacao = observacao;

                if (dataFoiAlterada) {
                    recorrencia.dia = agora.getDate();
                }

                salvarRecorrencias(recorrencias);

                parcelasGrupo
                    .filter(item => new Date(item.data) >= dataOriginal)
                    .forEach(item => {
                        aplicarAlteracoes(item, new Date(item.data), true);
                    });
            }
        } else if (registro.recorrente && opcao === "3") {
            const recorrencias = carregarRecorrencias();
            const recorrencia = recorrencias.find(
                item => String(item.id) === String(registro.recorrenciaId)
            );

            if (recorrencia) {
                recorrencia.descricao = descricao;
                recorrencia.valor = valor;
                recorrencia.tipo = tipo;
                recorrencia.categoria = categoria;
                recorrencia.formaPagamento = formaPagamento;
                recorrencia.observacao = observacao;

                if (dataFoiAlterada) {
                    recorrencia.dia = agora.getDate();
                }

                salvarRecorrencias(recorrencias);
            }

            parcelasGrupo.forEach(item => {
                aplicarAlteracoes(item, new Date(item.data), true);
            });

            aplicarAlteracoes(registro, agora, !dataFoiAlterada);
        } else if (opcao === "esta") {
            aplicarAlteracoes(registro, agora, !dataFoiAlterada);
        } else if (opcao === "2") {
            const indiceAtual = parcelasGrupo.findIndex(
                item => String(item.id) === String(registro.id)
            );

            parcelasGrupo.slice(indiceAtual).forEach((item, indice) => {
                if (!dataFoiAlterada) {
                    aplicarAlteracoes(item, new Date(item.data), true);
                    return;
                }

                const novaData = new Date(agora);
                novaData.setMonth(novaData.getMonth() + indice);
                aplicarAlteracoes(item, novaData);
            });
        } else if (opcao === "3") {
            parcelasGrupo.forEach((item, indice) => {
                if (!dataFoiAlterada) {
                    aplicarAlteracoes(item, new Date(item.data), true);
                    return;
                }

                const novaData = new Date(agora);
                novaData.setMonth(novaData.getMonth() + indice);
                aplicarAlteracoes(item, novaData);
            });
        }

        idEdicao = null;
        document.querySelector(".btnSalvar").innerText = "Salvar Registro";

        salvarDados(dados);
        limparFormulario();
        atualizarInicio();
        renderizar();

        const msg = document.getElementById("mensagem");
        msg.innerText = "Registro atualizado com sucesso!";
        msg.style.color = "green";

        setTimeout(() => {
            msg.innerText = "";
        }, 3000);

        return;
    }

    /* =====================================================
       NOVO LANÇAMENTO
    ===================================================== */

    const tipoRepeticaoTexto =
        parcelado.value === "sim"
            ? inputParcelas.value + "x"
            : parcelado.value === "recorrente"
                ? "Recorrente"
                : "Não";

    const confirmar = await abrirModalConfirmacao({
        titulo: "💾 Salvar lançamento",
        texto:
            `Descrição: ${descricao}\n` +
            `Valor: R$ ${moeda(valor)}\n` +
            `Categoria: ${categoria}\n` +
            `Repetição: ${tipoRepeticaoTexto}`,
        textoConfirmar: "Salvar"
    });

    if (!confirmar) {
        return;
    }

    const grupoID = String(Date.now() + Math.random());

    if (parcelado.value === "sim") {
        criarParcelas({
            dados,
            grupoID,
            descricao,
            valor,
            tipo,
            categoria,
            formaPagamento,
            observacao,
            agora
        });
    } else if (parcelado.value === "recorrente") {
        const recorrencias = carregarRecorrencias();

        recorrencias.push({
            id: grupoID,
            descricao,
            valor,
            tipo,
            categoria,
            formaPagamento,
            observacao,
            dia: agora.getDate(),
            inicio: agora.toISOString(),
            excluidos: []
        });

        salvarRecorrencias(recorrencias);

        dados.push({
            id: String(gerarID()),
            grupo: grupoID,
            recorrenciaId: grupoID,
            recorrente: true,
            descricao,
            valor,
            tipo,
            categoria,
            formaPagamento,
            observacao,
            parcela: "",
            status: "pendente",
            data: agora.toISOString()
        });
    } else {
        dados.push({
            id: String(gerarID()),
            grupo: grupoID,
            descricao,
            valor,
            tipo,
            categoria,
            formaPagamento,
            observacao,
            parcela: "",
            status: "pendente",
            data: agora.toISOString()
        });
    }

    salvarDados(dados);
    limparFormulario();
    atualizarInicio();
    renderizar();

    const msg = document.getElementById("mensagem");
    msg.innerText = "Registro salvo com sucesso!";
    msg.style.color = "green";

    setTimeout(() => {
        msg.innerText = "";
    }, 3000);
});

/* ==========================================================
   CRIAÇÃO DE PARCELAS
========================================================== */

function criarParcelas({
    dados,
    grupoID,
    descricao,
    valor,
    tipo,
    categoria,
    formaPagamento,
    observacao,
    agora
}) {
    const quantidade = Number(inputParcelas.value);
    const valorParcela = Number(valor);
    const diaOriginal = agora.getDate();

    for (let i = 0; i < quantidade; i++) {
        const ano = agora.getFullYear();
        const mes = agora.getMonth() + i;

        const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate();
        const dia = Math.min(diaOriginal, ultimoDiaDoMes);
        const dataParcela = new Date(ano, mes, dia, 12, 0, 0);

        dados.push({
            id: String(gerarID()),
            grupo: grupoID,
            descricao,
            valor: valorParcela,
            tipo,
            categoria,
            formaPagamento,
            observacao,
            parcela: `${i + 1}/${quantidade}`,
            status: "pendente",
            data: dataParcela.toISOString()
        });
    }
}

/* ==========================================================
   LIMPAR FORMULÁRIO
========================================================== */

function limparFormulario() {
    form.reset();

    inputValor.value = "";
    expressaoCalc = "";

    const resultadoTeclado = document.getElementById("resultadoTeclado");
    if (resultadoTeclado) {
        resultadoTeclado.innerText = "R$ 0,00";
    }

    areaParcelas.style.display = "none";
    inputParcelas.disabled = false;
    parcelado.disabled = false;
    inputParcelas.value = "";

    inputDataLancamento.value = dataHojeLocal();
    idEdicao = null;

    document.querySelector(".btnSalvar").innerText = "Salvar Registro";

    const botaoCancelar = document.getElementById("btnCancelarEdicao");
    if (botaoCancelar) {
        botaoCancelar.style.display = "none";
    }

    const aviso = document.getElementById("avisoEdicao");
    if (aviso) {
        aviso.innerText = "";
        aviso.style.display = "none";
    }
}

function cancelarEdicao() {
    idEdicao = null;
    limparFormulario();
    mostrarTela("telaResumo");
}

/* ==========================================================
   CRIAÇÃO VISUAL DAS TRANSAÇÕES
========================================================== */

function criarTransacao(item) {
    const div = document.createElement("div");
    div.className = "transacao";

    div.innerHTML = `
        <div class="linha linhaPrincipal">
            <div class="titulo tituloTransacao">
                <span class="descricaoTransacao">
                    ${item.descricao}
                </span>
                ${
                    item.parcela
                        ? `<span class="parcelaTitulo">${item.parcela}</span>`
                        : ""
                }
            </div>
            <div class="${
                item.tipo === "receita" ? "valorReceita" : "valorDespesa"
            } valorTransacao">
                R$ ${moeda(item.valor)}
            </div>
        </div>

        <div class="info">
            ${item.categoria ? item.categoria : ""}
            ${item.formaPagamento ? (item.categoria ? " | " : "") + item.formaPagamento : ""}
            ${item.categoria || item.formaPagamento ? " | " : ""}
            ${new Date(item.data).toLocaleDateString("pt-BR")}
        </div>

        ${
            item.observacao && item.observacao.trim() !== ""
                ? `<div class="info observacaoCompacta" onclick="verObservacao('${item.id}')" title="Clique para ver completa">📝 ${item.observacao}</div>`
                : ""
        }

        <div class="acoesTransacao">
            <button
                onclick="alterarStatus('${item.id}')"
                class="${item.status === "pago" ? "btnPago" : "btnPagar"}"
            >
                ${item.status === "pago" ? "Pago" : "Pagar"}
            </button>

            <button
                class="btnMenu"
                onclick="toggleMenu('${item.id}')"
            >
                ⋮
            </button>

            <div class="menuAcoes" id="menu-${item.id}">
                <button onclick="editarRegistro('${item.id}')">
                    ✏️ Editar
                </button>
                <button onclick="duplicarRegistro('${item.id}')">
                    📋 Duplicar
                </button>
                <button onclick="excluirRegistro('${item.id}')">
                    🗑️ Excluir
                
            </div>
        </div>
    `;

    return div;
}

/* ==========================================================
   ATUALIZAR TELA INICIAL
========================================================== */

function obterDataInicioSelecionada() {
    if (mesInicioAtual) {
        const [ano, mes] = mesInicioAtual.split("-").map(Number);
        return new Date(ano, mes - 1, 1);
    }
    const agora = new Date();
    return new Date(agora.getFullYear(), agora.getMonth(), 1);
}

function mudarMesInicio(direcao) {
    if (!mesInicioAtual) {
        const agora = new Date();
        mesInicioAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
    }

    const [ano, mes] = mesInicioAtual.split("-").map(Number);
    const data = new Date(ano, mes - 1, 1);
    data.setMonth(data.getMonth() + direcao);

    mesInicioAtual = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;

    gerarRecorrenciasDoMes(mesInicioAtual);
    atualizarInicio();
}

function atualizarInicio() {
    const dados = carregarDados();

    let receitas = 0;
    let despesas = 0;
    let pendentes = 0;
    let receitasAnterior = 0;
    let despesasAnterior = 0;

    const hoje = obterDataInicioSelecionada();
    const numeroMes = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const dataMesAnterior = new Date(anoAtual, numeroMes - 1, 1);
    const numeroMesAnterior = dataMesAnterior.getMonth();
    const anoMesAnterior = dataMesAnterior.getFullYear();

    const nomeMesOriginal = hoje.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    });
    const nomeMes =
        nomeMesOriginal.charAt(0).toUpperCase() + nomeMesOriginal.slice(1);

    const nomeMesAnteriorOriginal = dataMesAnterior.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    });
    const nomeMesAnterior =
        nomeMesAnteriorOriginal.charAt(0).toUpperCase() +
        nomeMesAnteriorOriginal.slice(1);

    if (mesAtualInicio) {
        mesAtualInicio.innerHTML = "📅 " + nomeMes;
    }

    if (quantidadeInicio) {
        quantidadeInicio.innerHTML = "📝 Lançamentos: " + dados.length;
    }

    dados.forEach(item => {
        const data = new Date(item.data);
        const mes = data.getMonth();
        const ano = data.getFullYear();

        if (mes === numeroMes && ano === anoAtual) {
            if (item.tipo === "receita") {
                receitas += Number(item.valor);
            }
            if (item.tipo === "despesa") {
                despesas += Number(item.valor);
                if (item.status === "pendente") {
                    pendentes += Number(item.valor);
                }
            }
        }

        if (mes === numeroMesAnterior && ano === anoMesAnterior) {
            if (item.tipo === "receita") {
                receitasAnterior += Number(item.valor);
            }
            if (item.tipo === "despesa") {
                despesasAnterior += Number(item.valor);
            }
        }
    });

    const mesAnteriorComparativo = document.getElementById("mesAnteriorComparativo");
    const mesAtualComparativo = document.getElementById("mesAtualComparativo");
    const gastosMesAnterior = document.getElementById("gastosMesAnterior");
    const receitasMesAnterior = document.getElementById("receitasMesAnterior");
    const gastosMesAtual = document.getElementById("gastosMesAtual");
    const receitasMesAtual = document.getElementById("receitasMesAtual");

    if (mesAnteriorComparativo) mesAnteriorComparativo.innerHTML = nomeMesAnterior;
    if (mesAtualComparativo) mesAtualComparativo.innerHTML = nomeMes;
    if (gastosMesAnterior) gastosMesAnterior.innerHTML = `R$ ${moeda(despesasAnterior)}`;
    if (receitasMesAnterior) receitasMesAnterior.innerHTML = `R$ ${moeda(receitasAnterior)}`;
    if (gastosMesAtual) gastosMesAtual.innerHTML = `R$ ${moeda(despesas)}`;
    if (receitasMesAtual) receitasMesAtual.innerHTML = `R$ ${moeda(receitas)}`;
    const resumoComparativo = document.getElementById("resumoComparativo");
    if (resumoComparativo) {
        resumoComparativo.classList.remove("economia", "aumento");

        if (despesasAnterior === 0 && despesas === 0) {
            resumoComparativo.innerText = "";
        } else if (despesasAnterior === 0 && despesas > 0) {
            resumoComparativo.innerText = "📊 Primeiro mês com gastos registrados neste comparativo.";
        } else {
            const diferenca = despesas - despesasAnterior;

            if (diferenca < 0) {
                resumoComparativo.classList.add("economia");
                resumoComparativo.innerText = `📉 Você gastou R$ ${moeda(Math.abs(diferenca))} a menos que no mês passado.`;
            } else if (diferenca > 0) {
                resumoComparativo.classList.add("aumento");
                resumoComparativo.innerText = `📈 Você gastou R$ ${moeda(diferenca)} a mais que no mês passado.`;
            } else {
                resumoComparativo.innerText = "➖ Seus gastos estão iguais aos do mês passado.";
            }
        }
    }

    const saldo = receitas - despesas;

    if (saldoInicio) {
        saldoInicio.innerHTML = `📊 Saldo do mês: R$ ${moeda(saldo)}`;
        saldoInicio.classList.toggle("saldoNegativo", saldo < 0);
    }
    if (receitasInicio) receitasInicio.innerHTML = `💰 Receitas: R$ ${moeda(receitas)}`;
    if (despesasInicio) despesasInicio.innerHTML = `💸 Despesas: R$ ${moeda(despesas)}`;
    if (pendenciasInicio) pendenciasInicio.innerHTML = `⚠️ Pendentes do mês: R$ ${moeda(pendentes)}`;

    atualizarResumoInteligente();

    verificarLembreteBackup();

}

function atualizarResumoInteligente() {
    const dados = carregarDados();
    const hoje = obterDataInicioSelecionada();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    let gastos = 0;
    let receitas = 0;
    let categorias = {};
    let pagamentos = {};

    dados.forEach(item => {
        const data = new Date(item.data);

        if (data.getMonth() === mesAtual && data.getFullYear() === anoAtual) {
            if (item.tipo === "despesa") {
                gastos += Number(item.valor);

                const nomeCategoria = item.categoria || "Sem categoria";
                categorias[nomeCategoria] =
                    (categorias[nomeCategoria] || 0) + Number(item.valor);

                const pagamento = item.formaPagamento || "Não informado";
                pagamentos[pagamento] =
                    (pagamentos[pagamento] || 0) + Number(item.valor);
            }

            if (item.tipo === "receita") {
                receitas += Number(item.valor);
            }
        }
    });

    let categoriaMaior = "-";
    let valorMaior = 0;

    for (let categoria in categorias) {
        if (categorias[categoria] > valorMaior) {
            valorMaior = categorias[categoria];
            categoriaMaior = categoria;
        }
    }

    if (gastosMes) gastosMes.innerHTML = `R$ ${moeda(gastos)}`;
    if (receitasMes) receitasMes.innerHTML = `R$ ${moeda(receitas)}`;
    if (resultadoMes) resultadoMes.innerHTML = `📊 Resultado: R$ ${moeda(receitas - gastos)}`;

    const cardMaiorGasto = document.getElementById("maiorGasto");
    if (cardMaiorGasto) {
        cardMaiorGasto.innerHTML = `🏆 Maior gasto: ${categoriaMaior} • R$ ${moeda(valorMaior)}`;
    }

    const resumoCategorias = document.getElementById("resumoCategorias");
    if (resumoCategorias) {
        const categoriasCadastradas = JSON.parse(
            localStorage.getItem("controle_categorias") || "[]"
        );

        resumoCategorias.innerHTML =
            Object.entries(categorias)
                .sort(([, a], [, b]) => b - a)
                .map(([categoria, valor]) => {
                    const catObj = categoriasCadastradas.find(c => c.nome === categoria);
                    const limite = catObj && Number(catObj.limite) > 0 ? Number(catObj.limite) : 0;
                    const porcentagemTotal = gastos > 0 ? Math.round((valor / gastos) * 100) : 0;

                    let larguraBarra = porcentagemTotal;
                    let classeLimite = "";
                    let textoPorcentagem = `${porcentagemTotal}%`;
                    let textoValor = `R$ ${moeda(valor)}`;

                    if (limite > 0) {
                        const pctLimite = Math.round((valor / limite) * 100);
                        larguraBarra = Math.min((valor / limite) * 100, 100);
                        textoValor = `R$ ${moeda(valor)} / ${moeda(limite)}`;
                        textoPorcentagem = pctLimite > 100 ? `${pctLimite}% ⚠️` : `${pctLimite}%`;

                        if (pctLimite > 100) {
                            classeLimite = "limiteEstourou";
                        } else if (pctLimite >= 80) {
                            classeLimite = "limiteAtencao";
                        } else {
                            classeLimite = "limiteOk";
                        }
                    }

                    return `
                        <div class="linhaResumo" onclick="abrirTransacoesFiltradas('${encodeURIComponent(categoria)}', 'despesas')">
                            <span class="linhaResumoTopo">
                                <span class="linhaResumoNome">🏷️ ${categoria}</span>
                                <span class="linhaResumoValor">
                                    ${textoValor}
                                    <strong class="${classeLimite}">${textoPorcentagem}</strong>
                                </span>
                            </span>
                            <span class="barraResumo">
                                <span class="progressoResumo ${classeLimite}" style="width:${larguraBarra}%"></span>
                            </span>
                        </div>
                    `;
                })
                .join("") || "Nenhum gasto registrado.";
    }

    const resumoPagamentos = document.getElementById("resumoPagamentos");
    if (resumoPagamentos) {
        resumoPagamentos.innerHTML =
            Object.entries(pagamentos)
                .sort(([, a], [, b]) => b - a)
                .map(([pagamento, valor]) => {
                    const porcentagem =
                        gastos > 0 ? Math.round((valor / gastos) * 100) : 0;

                    return `
                    <div class="linhaResumo" onclick="abrirTransacoesFiltradas('${encodeURIComponent(pagamento)}', 'despesas')">
                            <span class="linhaResumoTopo">
                                <span class="linhaResumoNome">💳 ${pagamento}</span>
                                <span class="linhaResumoValor">
                                    R$ ${moeda(valor)}
                                    <strong>${porcentagem}%</strong>
                                </span>
                            </span>
                            <span class="barraResumo">
                                <span class="progressoResumo" style="width:${porcentagem}%"></span>
                            </span>
                        </div>
                    `;
                })
                .join("") || "Nenhum gasto registrado.";
    } 
}

/* ==========================================================
   RENDERIZAÇÃO DO HISTÓRICO
========================================================== */

let filtroRapidoAtual = "todos";

function abrirTransacoesFiltradas(textoCodificado, tipoFiltro = "todos") {
    const hoje = new Date();
    filtroMes.value = mesInicioAtual || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
    atualizarMesExibido();

    buscar.value = decodeURIComponent(textoCodificado);

    const botoes = document.querySelectorAll(".btnFiltroRapido");
    let botaoAlvo = botoes[0] || null;

    botoes.forEach(btn => {
        if (btn.getAttribute("onclick")?.includes(`'${tipoFiltro}'`)) {
            botaoAlvo = btn;
        }
    });

    definirFiltroRapido(tipoFiltro, botaoAlvo);
    mostrarTela("telaResumo");
}

function limparFiltrosLista() {
    buscar.value = "";
    const primeiroBotao = document.querySelector(".btnFiltroRapido");
    definirFiltroRapido("todos", primeiroBotao);
}

function definirFiltroRapido(tipo, botao) {
    filtroRapidoAtual = tipo;

    document.querySelectorAll(".btnFiltroRapido").forEach(btn => {
        btn.classList.remove("ativo");
    });

    if (botao) {
        botao.classList.add("ativo");
    }

    renderizar();
}

function renderizar() {
    let dados = carregarDados();

    let totalDespesas = 0;
    let totalReceitas = 0;
    let totalPendente = 0;

    if (filtroMes.value) {
        dados = dados.filter(item => {
            const data = new Date(item.data);
            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, "0");
            return `${ano}-${mes}` === filtroMes.value;
        });
    }

    if (buscar.value.trim() !== "") {
        const normalizar = texto =>
            String(texto ?? "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();

        const texto = normalizar(buscar.value.trim());

        dados = dados.filter(item => {
            const dataFormatada = new Date(item.data).toLocaleDateString("pt-BR");
            const camposBusca = [
                item.descricao,
                item.categoria || "Sem categoria",
                item.formaPagamento || "Não informado",
                item.observacao,
                item.parcela,
                item.status,
                item.tipo,
                dataFormatada,
                String(item.valor),
                moeda(item.valor)
            ].join(" ");

            return normalizar(camposBusca).includes(texto);
        });
    }

    dados.forEach(item => {
        if (item.tipo === "receita") {
            totalReceitas += Number(item.valor);
        }

        if (item.tipo === "despesa") {
            totalDespesas += Number(item.valor);
            if (item.status === "pendente") {
                totalPendente += Number(item.valor);
            }
        }
    });

    if (filtroRapidoAtual === "pendentes") {
        dados = dados.filter(item => item.status === "pendente");
    } else if (filtroRapidoAtual === "despesas") {
        dados = dados.filter(item => item.tipo === "despesa");
    } else if (filtroRapidoAtual === "receitas") {
        dados = dados.filter(item => item.tipo === "receita");
    }

    dados.sort((a, b) => {
        if (ordenacao.value === "maiorValor") {
            return b.valor - a.valor;
        }
        if (ordenacao.value === "menorValor") {
            return a.valor - b.valor;
        }
        if (ordenacao.value === "pendente") {
            return (a.status === "pago") - (b.status === "pago");
        }
        return new Date(b.data) - new Date(a.data);
    });

    lista.innerHTML = "";

    totalDespesasMes.innerHTML = `💸 Total de despesas: R$ ${moeda(totalDespesas)}`;
    totalReceitasMes.innerHTML = `💰 Total de receitas: R$ ${moeda(totalReceitas)}`;
    const saldoCalculado = totalReceitas - totalDespesas;
    saldoMes.innerHTML = `📊 Saldo: R$ ${moeda(saldoCalculado)}`;
    saldoMes.classList.toggle("saldoNegativo", saldoCalculado < 0);
    totalPendenteMes.innerHTML = `⚠️ Pendente: R$ ${moeda(totalPendente)}`;

    const resumoFiltroLista = document.getElementById("resumoFiltroLista");
    if (resumoFiltroLista) {
        const temFiltroAtivo = buscar.value.trim() !== "" || filtroRapidoAtual !== "todos";

        if (!temFiltroAtivo) {
            resumoFiltroLista.innerHTML = "";
        } else {
            let somaDespesas = 0;
            let somaReceitas = 0;

            dados.forEach(item => {
                if (item.tipo === "receita") somaReceitas += Number(item.valor);
                else somaDespesas += Number(item.valor);
            });

            let textoTotal = "";
            if (somaReceitas > 0 && somaDespesas > 0) {
                textoTotal = `Saldo: R$ ${moeda(somaReceitas - somaDespesas)}`;
            } else if (somaReceitas > 0) {
                textoTotal = `Total: R$ ${moeda(somaReceitas)}`;
            } else {
                textoTotal = `Total: R$ ${moeda(somaDespesas)}`;
            }

            resumoFiltroLista.innerHTML = `
                <span>🔎 ${dados.length} registro(s) • <strong>${textoTotal}</strong></span>
                <button type="button" class="btnLimparFiltroLista" onclick="limparFiltrosLista()">✕ Limpar</button>
            `;
        }
    }

    if (dados.length === 0) {
        lista.innerHTML = "<p>Nenhum registro encontrado.</p>";
        return;
    }

    dados.forEach(item => {
        const div = criarTransacao(item);

        if (item.status === "pago") {
            div.style.borderLeft = "5px solid #43a047";
        } else {
            div.style.borderLeft = "5px solid #fbc02d";
        }

        lista.appendChild(div);
    });
}

/* ==========================================================
   ALTERAR STATUS
========================================================== */

function alterarStatus(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);

    if (!registro) return;

    registro.status = registro.status === "pago" ? "pendente" : "pago";

    salvarDados(dados);
    atualizarInicio();
    renderizar();
}

/* ==========================================================
   EXCLUIR REGISTRO INDIVIDUAL
========================================================== */

async function excluirRegistro(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);

    document.querySelectorAll(".menuAcoes").forEach(menu => {
        menu.classList.remove("aberto");
    });

    if (registro.parcela) {
        excluirGrupo(id);
        return;
    }

    if (!registro.recorrente && !registro.parcela) {
        const opcao = await abrirModalOpcoes({
            titulo: "🗑️ Excluir lançamento",
            texto: `Tem certeza que deseja excluir "${registro.descricao}" (R$ ${moeda(registro.valor)})?`,
            opcoes: [
                { valor: "1", texto: "🗑️ Excluir este lançamento", perigo: true }
            ]
        });
        
        if (!opcao) return;

        const novosDados = dados.filter(item => String(item.id) !== String(id));
        salvarDados(novosDados);
        atualizarInicio();
        renderizar();
        return;
    }

    const opcao = await abrirModalOpcoes({
        titulo: "🗑️ Excluir recorrência",
        texto: "Este lançamento faz parte de uma recorrência. O que deseja excluir?",
        opcoes: [
            { valor: "1", texto: "Excluir somente este mês" },
            { valor: "2", texto: "Excluir este mês e os próximos" },
            { valor: "3", texto: "Excluir este mês e os anteriores" },
            { valor: "4", texto: "Excluir toda a recorrência", perigo: true }
        ]
    });

    if (!opcao) return;

    const dataRegistro = new Date(registro.data);
    const ano = dataRegistro.getFullYear();
    const mes = dataRegistro.getMonth();
    const chaveMes = `${ano}-${String(mes + 1).padStart(2, "0")}`;

    const recorrencias = carregarRecorrencias();
    const recorrencia = recorrencias.find(
        item => String(item.id) === String(registro.recorrenciaId)
    );

    if (!recorrencia) return;

    if (opcao === "1") {
        if (!recorrencia.excluidos) recorrencia.excluidos = [];
        if (!recorrencia.excluidos.includes(chaveMes)) {
            recorrencia.excluidos.push(chaveMes);
        }

        salvarRecorrencias(recorrencias);
        salvarDados(dados.filter(item => String(item.id) !== String(id)));
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "2") {
        const mesAnterior = new Date(ano, mes - 1, 1);
        const fim = `${mesAnterior.getFullYear()}-${String(
            mesAnterior.getMonth() + 1
        ).padStart(2, "0")}`;

        recorrencia.fim = fim;
        salvarRecorrencias(recorrencias);

        const novosDados = dados.filter(item => {
            if (String(item.recorrenciaId) !== String(registro.recorrenciaId)) {
                return true;
            }
            return new Date(item.data) < dataRegistro;
        });

        salvarDados(novosDados);
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "3") {
        if (!recorrencia.excluidos) recorrencia.excluidos = [];

        const inicio = new Date(recorrencia.inicio);
        let anoAtual = inicio.getFullYear();
        let mesAtual = inicio.getMonth();

        while (anoAtual < ano || (anoAtual === ano && mesAtual <= mes)) {
            const chave = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}`;
            if (!recorrencia.excluidos.includes(chave)) {
                recorrencia.excluidos.push(chave);
            }
            mesAtual++;
            if (mesAtual > 11) {
                mesAtual = 0;
                anoAtual++;
            }
        }

        salvarRecorrencias(recorrencias);
        salvarDados(
            dados.filter(item => {
                if (String(item.recorrenciaId) !== String(registro.recorrenciaId)) {
                    return true;
                }
                return new Date(item.data) > dataRegistro;
            })
        );
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "4") {
        const novasRecorrencias = recorrencias.filter(
            item => String(item.id) !== String(registro.recorrenciaId)
        );

        salvarRecorrencias(novasRecorrencias);
        salvarDados(
            dados.filter(
                item => String(item.recorrenciaId) !== String(registro.recorrenciaId)
            )
        );
        atualizarInicio();
        renderizar();
        return;
    }
}

/* ==========================================================
   EXCLUIR GRUPO DE PARCELAS
========================================================== */

async function excluirGrupo(id) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);

    if (!registro) return;

    if (!registro.parcela) {
        excluirRegistro(id);
        return;
    }

    const partes = registro.parcela.split("/");
    const numeroParcela = Number(partes[0]);

    const opcao = await abrirModalOpcoes({
        titulo: "🗑️ Excluir parcelamento",
        texto: "Este lançamento faz parte de um parcelamento. O que deseja excluir?",
        opcoes: [
            { valor: "1", texto: "Excluir somente esta parcela" },
            { valor: "2", texto: "Excluir esta e as próximas" },
            { valor: "3", texto: "Excluir esta e as anteriores" },
            { valor: "4", texto: "Excluir todas as parcelas", perigo: true }
        ]
    });

    if (!opcao) return;

    const grupo = String(registro.grupo);

    if (opcao === "1") {
        salvarDados(dados.filter(item => String(item.id) !== String(id)));
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "2") {
        salvarDados(
            dados.filter(item => {
                if (String(item.grupo) !== grupo) return true;
                const partesItem = item.parcela ? item.parcela.split("/") : [];
                return Number(partesItem[0]) < numeroParcela;
            })
        );
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "3") {
        salvarDados(
            dados.filter(item => {
                if (String(item.grupo) !== grupo) return true;
                const partesItem = item.parcela ? item.parcela.split("/") : [];
                return Number(partesItem[0]) > numeroParcela;
            })
        );
        atualizarInicio();
        renderizar();
        return;
    }

    if (opcao === "4") {
        salvarDados(dados.filter(item => String(item.grupo) !== grupo));
        atualizarInicio();
        renderizar();
        return;
    }
}

/* ==========================================================
   SALVAR OBSERVAÇÃO
========================================================== */

function salvarObservacao(id, texto) {
    const dados = carregarDados();
    const registro = encontrarRegistro(dados, id);

    if (!registro) return;

    registro.observacao = texto.trim();
    salvarDados(dados);
}

/* ==========================================================
   LIMPAR FILTRO
========================================================== */

function limparFiltro() {
    filtroMes.value = "";
    renderizar();
}

/* ==========================================================
   INICIALIZAÇÃO DO APP
========================================================== */

function iniciarApp() {
    if (inputDescricao) inputDescricao.maxLength = LIMITES_TEXTO.descricao;
    if (inputObservacao) inputObservacao.maxLength = LIMITES_TEXTO.observacao;

    inputDataLancamento.value = dataHojeLocal();

    const hoje = new Date();
    filtroMes.value =
        hoje.getFullYear() +
        "-" +
        String(hoje.getMonth() + 1).padStart(2, "0");

    mesInicioAtual = filtroMes.value;
    
    atualizarMesExibido();
    gerarRecorrenciasDoMes();
    atualizarInicio();
    atualizarResumoInteligente();
    renderizar();
}

/* ==========================================================
   EXECUÇÃO INICIAL
========================================================== */

iniciarApp();

/* ==========================================================
   TEMA ESCURO
========================================================== */

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

const temaSalvo = localStorage.getItem("tema");

if (temaSalvo === "dark") {
    document.body.classList.add("dark");
    if (textoTema) {
        textoTema.innerText = "☀️ Tema claro";
    }
}

/* ==========================================================
   NAVEGAÇÃO ENTRE TELAS
========================================================== */

let telaExtraNoHistorico = false;

function mostrarTela(id, botao = null) {
    if (id === "telaInicio") {
        if (telaExtraNoHistorico) {
            history.back();
        }
    } else if (!telaExtraNoHistorico) {
        history.pushState({ tela: id }, "");
        telaExtraNoHistorico = true;
    } else {
        history.replaceState({ tela: id }, "");
    }

    exibirTela(id, botao);
}

window.addEventListener("popstate", () => {
    telaExtraNoHistorico = false;
    exibirTela("telaInicio");
});

function exibirTela(id, botao = null) {
    document.querySelectorAll(".tela").forEach(tela => {
        tela.classList.remove("ativa");
    });

    if (id === "telaResumo") {
        renderizar();
    }

    const tela = document.getElementById(id);
    if (tela) {
        tela.classList.add("ativa");
    }

    document.querySelectorAll(".itemMenu").forEach(item => {
        item.classList.remove("ativo");
    });

    if (botao) {
        botao.classList.add("ativo");
    } else {
        const mapa = {
            telaInicio: 0,
            telaLancamentos: 1,
            telaResumo: 2,
            telaMetas: 3,
            telaConfiguracoes: 4
        };

        const indice = mapa[id];
        if (indice !== undefined) {
            document.querySelectorAll(".itemMenu")[indice].classList.add("ativo");
        }
    }
}

/* ==========================================================
   BACKUP
========================================================== */

const botaoBackup = document.getElementById("btnBackup");

if (botaoBackup) {
    botaoBackup.addEventListener("click", () => {
        const dados = carregarDados();
        const metas = carregarMetas();
        const recorrencias = carregarRecorrencias();

        const arquivo = JSON.stringify(
            {
                lancamentos: dados,
                metas: metas,
                recorrencias: recorrencias
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

/* ==========================================================
   RESTAURAR BACKUP
========================================================== */

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

/* ==========================================================
   SISTEMA DE METAS
========================================================== */

const STORAGE_METAS = "controle_metas";
let metaAtualId = null;

function carregarMetas() {
    return JSON.parse(localStorage.getItem(STORAGE_METAS) || "[]");
}

function salvarMetas(metas) {
    localStorage.setItem(STORAGE_METAS, JSON.stringify(metas));
}

function encontrarMeta(id) {
    const metas = carregarMetas();
    return metas.find(meta => String(meta.id) === String(id));
}

async function abrirFormularioMeta() {
    const resposta = await abrirModalFormulario({
        titulo: "🎯 Nova meta",
        campos: [
            {
                id: "nome",
                label: "Nome da meta",
                placeholder: "Ex: Reserva de emergência",
                maxLength: LIMITES_TEXTO.meta
            },
            {
                id: "valor",
                label: "Valor que deseja atingir (R$)",
                placeholder: "Ex: 5000,00",
                inputmode: "decimal"
            }
        ],
        textoConfirmar: "Criar meta"
    });

    if (!resposta) return;

    const nome = resposta.nome;
    if (!nome || !nome.trim()) {
        abrirModalAviso("Digite o nome da meta.");
        return;
    }

    const valorTexto = resposta.valor;
    if (!valorTexto) {
        abrirModalAviso("Digite o valor da meta.");
        return;
    }

    const valorMeta = Number(
        valorTexto.replace(/\./g, "").replace(",", ".")
    );

    if (!valorMeta || valorMeta <= 0) {
        abrirModalAviso("Digite um valor de meta válido.");
        return;
    }

    const metas = carregarMetas();

    metas.push({
        id: String(gerarID()),
        nome: nome.trim(),
        valorMeta: valorMeta,
        aportes: []
    });

    salvarMetas(metas);
    renderizarMetas();
}

function renderizarMetas() {
    const lista = document.getElementById("listaMetas");
    if (!lista) return;

    const metas = carregarMetas();
    lista.innerHTML = "";

    if (metas.length === 0) {
        lista.innerHTML = `
          <div class="card">
            <p>Você ainda não possui nenhuma meta.</p>
            <p style="margin-top:8px;color:#777;">
              Crie sua primeira meta acima.
            </p>
          </div>
        `;
        return;
    }

    metas.forEach(meta => {
        const atual = meta.aportes.reduce(
            (total, aporte) => total + Number(aporte.valor),
            0
        );
        const faltante = Math.max(meta.valorMeta - atual, 0);
        const porcentagem = Math.min((atual / meta.valorMeta) * 100, 100);

        const div = document.createElement("div");
        div.className = "cardMeta";
        div.onclick = function() {
            abrirMeta(meta.id);
        };

        div.innerHTML = `
          <div class="nomeMeta">🎯 ${meta.nome}</div>
          <div class="valoresMeta">
            <div class="valorAtualMeta">Atual: R$ ${moeda(atual)}</div>
            <div class="valorObjetivoMeta">Meta: R$ ${moeda(meta.valorMeta)}</div>
            <div class="valorFaltanteMeta">
              ${faltante > 0 ? "Faltam: R$ " + moeda(faltante) : "Meta atingida! 🎉"}
            </div>
          </div>
          <div class="barraMeta">
            <div class="progressoMeta" style="width:${porcentagem}%"></div>
          </div>
          <div class="porcentagemMeta">${porcentagem.toFixed(0)}%</div>
        `;

        lista.appendChild(div);
    });
}

function abrirMeta(id) {
    metaAtualId = id;
    const meta = encontrarMeta(id);
    if (!meta) return;

    document.getElementById("tituloMetaDetalhe").innerText = "🎯 " + meta.nome;
    renderizarDetalheMeta();
    mostrarTela("telaDetalheMeta");
}

function renderizarDetalheMeta() {
    const meta = encontrarMeta(metaAtualId);
    if (!meta) return;

    const atual = meta.aportes.reduce(
        (total, aporte) => total + Number(aporte.valor),
        0
    );
    const faltante = Math.max(meta.valorMeta - atual, 0);
    const porcentagem = Math.min((atual / meta.valorMeta) * 100, 100);

    const resumo = document.getElementById("resumoMetaDetalhe");
    resumo.innerHTML = `
      <div class="valoresMeta">
        <div class="valorAtualMeta">💰 Atual: R$ ${moeda(atual)}</div>
        <div class="valorObjetivoMeta">🎯 Meta: R$ ${moeda(meta.valorMeta)}</div>
        <div class="valorFaltanteMeta">
          ${faltante > 0 ? "📌 Faltam: R$ " + moeda(faltante) : "🎉 Meta atingida!"}
        </div>
        <div class="barraMeta">
          <div class="progressoMeta" style="width:${porcentagem}%"></div>
        </div>
        <div class="porcentagemMeta">${porcentagem.toFixed(0)}% concluído</div>
      </div>
    `;

    renderizarHistoricoMeta();
}

function renderizarHistoricoMeta() {
    const area = document.getElementById("historicoMeta");
    if (!area) return;

    const meta = encontrarMeta(metaAtualId);
    if (!meta) return;

    area.innerHTML = "";

    if (meta.aportes.length === 0) {
        area.innerHTML = "<p>Nenhum valor adicionado ainda.</p>";
        return;
    }

    const aportes = [...meta.aportes].sort(
        (a, b) => new Date(b.data) - new Date(a.data)
    );

    aportes.forEach(aporte => {
        const div = document.createElement("div");
        div.className = "itemHistoricoMeta";

        div.innerHTML = `
          <div>
            <div class="valorHistoricoMeta">+ R$ ${moeda(aporte.valor)}</div>
            <div class="dataHistoricoMeta">${formatarData(aporte.data)}</div>
          </div>
          <button
            class="btnExcluirAporte"
            onclick="event.stopPropagation(); excluirAporte('${aporte.id}')">
            Excluir
          </button>
        `;

        area.appendChild(div);
    });
}

const formAporteMeta = document.getElementById("formAporteMeta");

if (formAporteMeta) {
    formAporteMeta.addEventListener("submit", function(evento) {
        evento.preventDefault();
        if (!metaAtualId) return;

        const campo = document.getElementById("valorAporteMeta");
        const valor = Number(
            campo.value.replace(/\./g, "").replace(",", ".")
        );

        if (!valor || valor <= 0) {
            abrirModalAviso("Digite um valor válido.");
            return;
        }

        const metas = carregarMetas();
        const meta = metas.find(item => String(item.id) === String(metaAtualId));
        if (!meta) return;

        meta.aportes.push({
            id: String(gerarID()),
            valor: valor,
            data: new Date().toISOString()
        });

        salvarMetas(metas);
        campo.value = "";

        renderizarDetalheMeta();
        renderizarMetas();

        const mensagem = document.getElementById("mensagemMeta");
        mensagem.innerText = "Valor adicionado com sucesso!";
        mensagem.style.color = "green";

        setTimeout(() => {
            mensagem.innerText = "";
        }, 3000);
    });
}

async function excluirAporte(id) {
    const confirmar = await abrirModalConfirmacao({
        titulo: "🗑️ Excluir valor",
        texto: "Deseja excluir este valor da meta?",
        textoConfirmar: "Excluir",
        perigo: true
    });

    if (!confirmar) return;

    const metas = carregarMetas();
    const meta = metas.find(item => String(item.id) === String(metaAtualId));
    if (!meta) return;

    meta.aportes = meta.aportes.filter(
        aporte => String(aporte.id) !== String(id)
    );

    salvarMetas(metas);
    renderizarDetalheMeta();
    renderizarMetas();
}

async function excluirMetaAtual() {
    const meta = encontrarMeta(metaAtualId);
    if (!meta) return;

    const confirmar = await abrirModalConfirmacao({
        titulo: "🗑️ Excluir meta",
        texto: `Deseja excluir a meta "${meta.nome}"?\n\nTodos os valores registrados nela também serão excluídos.`,
        textoConfirmar: "Excluir meta",
        perigo: true
    });

    if (!confirmar) return;

    let metas = carregarMetas();
    metas = metas.filter(item => String(item.id) !== String(metaAtualId));

    salvarMetas(metas);
    metaAtualId = null;

    mostrarTela("telaMetas");
    renderizarMetas();
}

const mostrarTelaOriginal = mostrarTela;

mostrarTela = function(id, botao = null) {
    mostrarTelaOriginal(id, botao);

    if (id === "telaMetas") {
        renderizarMetas();
    }
    if (id === "telaDetalheMeta") {
        renderizarDetalheMeta();
    }
};

/* ==========================================================
   CALCULADORA DO CAMPO VALOR
========================================================== */

let expressaoCalc = "";

function teclaCalc(tecla) {
    expressaoCalc += tecla;
    document.getElementById("valor").value = expressaoCalc;

    const resultado = calcularExpressao(expressaoCalc);
    document.getElementById("resultadoTeclado").innerText =
        resultado !== null ? "R$ " + moeda(resultado) : expressaoCalc;
}

function apagarCalc() {
    expressaoCalc = expressaoCalc.slice(0, -1);
    document.getElementById("valor").value = expressaoCalc;
    atualizarTeclado();
}

function limparCalc() {
    expressaoCalc = "";
    document.getElementById("valor").value = "";
    document.getElementById("resultadoTeclado").innerText = "R$ 0,00";
}

function atualizarTeclado() {
    const resultado = calcularExpressao(expressaoCalc);
    document.getElementById("resultadoTeclado").innerText =
        resultado !== null
            ? "R$ " + moeda(resultado)
            : expressaoCalc || "R$ 0,00";
}

function finalizarCalc() {
    const resultado = calcularExpressao(expressaoCalc);

    if (resultado === null) {
        abrirModalAviso("Conta inválida.");
        return;
    }

    expressaoCalc = String(resultado).replace(".", ",");
    document.getElementById("valor").value = moeda(resultado);
    document.getElementById("resultadoTeclado").innerText = "R$ " + moeda(resultado);
}

document.addEventListener("click", function(evento) {
    const teclado = document.getElementById("tecladoValor");
    if (!teclado) return;

    if (!teclado.contains(evento.target) && evento.target.id !== "valor") {
        teclado.style.display = "none";
    }
});

/* ==========================================================
   SISTEMA DE CATEGORIAS
========================================================== */

const STORAGE_CATEGORIAS = "controle_categorias";

const categoriasPadrao = [
    { nome: "Alimentação", icone: "🍔" },
    { nome: "Transporte", icone: "🚗" },
    { nome: "Lazer", icone: "🎮" },
    { nome: "Moradia", icone: "🏠" },
    { nome: "Saúde", icone: "💊" },
    { nome: "Salário", icone: "💰" },
    { nome: "Outros", icone: "📦" }
];

function carregarCategorias() {
    let categorias = JSON.parse(
        localStorage.getItem(STORAGE_CATEGORIAS) || "null"
    );

    if (!categorias) {
        categorias = categoriasPadrao;
        localStorage.setItem(STORAGE_CATEGORIAS, JSON.stringify(categorias));
    }

    return categorias;
}

function salvarCategorias(categorias) {
    localStorage.setItem(STORAGE_CATEGORIAS, JSON.stringify(categorias));
}

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

const mostrarTelaComCategorias = mostrarTela;

mostrarTela = function(id, botao = null) {
    mostrarTelaComCategorias(id, botao);

    if (id === "telaCategorias") {
        renderizarCategorias();
    }
};

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

atualizarCategoriasLancamento();

/* ==========================================================
   FORMAS DE PAGAMENTO
========================================================== */

const STORAGE_FORMAS_PAGAMENTO = "controle_formas_pagamento";

const formasPagamentoPadrao = [
    { nome: "Dinheiro", icone: "💵" },
    { nome: "Cartão de débito", icone: "💳" },
    { nome: "Cartão de crédito", icone: "💳" }
];

function carregarFormasPagamento() {
    let formas = JSON.parse(
        localStorage.getItem(STORAGE_FORMAS_PAGAMENTO) || "null"
    );

    if (!formas) {
        formas = formasPagamentoPadrao;
        localStorage.setItem(STORAGE_FORMAS_PAGAMENTO, JSON.stringify(formas));
    }

    return formas;
}

function salvarFormasPagamento(formas) {
    localStorage.setItem(STORAGE_FORMAS_PAGAMENTO, JSON.stringify(formas));
}

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

const mostrarTelaComFormasPagamento = mostrarTela;

mostrarTela = function(id, botao = null) {
    mostrarTelaComFormasPagamento(id, botao);

    if (id === "telaFormasPagamento") {
        renderizarFormasPagamento();
    }
};

atualizarFormasPagamentoLancamento();

document.addEventListener("DOMContentLoaded", () => {
    atualizarFormasPagamentoLancamento();
});

/* ==========================================================
   POP-UP INFORMATIVO DO RESUMO
========================================================== */

function mostrarInfoResumo(tipo) {
    const popup = document.getElementById("popupInfoResumo");
    const titulo = document.getElementById("tituloInfoResumo");
    const texto = document.getElementById("textoInfoResumo");

    if (tipo === "categoria") {
        titulo.innerHTML = "🏷️ Gastos por categoria";
        texto.innerHTML =
            "Mostra como os gastos deste mês estão distribuídos entre as categorias.<br><br>" +
            "A porcentagem representa quanto cada categoria corresponde do total de gastos do mês.";
    }

    if (tipo === "pagamento") {
        titulo.innerHTML = "💳 Gastos por forma de pagamento";
        texto.innerHTML =
            "Mostra quanto foi gasto usando cada forma de pagamento neste mês.<br><br>" +
            "A porcentagem representa quanto cada forma de pagamento corresponde do total de gastos.";
    }

    popup.style.display = "flex";
}

function fecharInfoResumo() {
    const popup = document.getElementById("popupInfoResumo");
    popup.style.display = "none";
}

/* ==========================================================
   MODAIS DO APP
========================================================== */

function abrirModalOpcoes({ titulo, texto = "", opcoes = [] }) {
    return new Promise((resolve) => {
        const modal = document.getElementById("modalApp");
        const elTitulo = document.getElementById("modalTitulo");
        const elTexto = document.getElementById("modalTexto");
        const elCorpo = document.getElementById("modalCorpo");
        const elBotoes = document.getElementById("modalBotoes");
        const btnFechar = document.getElementById("modalFechar");

        elTitulo.innerText = titulo;
        elTexto.innerText = texto;
        elCorpo.innerHTML = "";
        elBotoes.innerHTML = "";

        const listaOpcoes = document.createElement("div");
        listaOpcoes.className = "modalListaOpcoes";

        const finalizar = (valor) => {
            modal.style.display = "none";
            modal.onclick = null;
            btnFechar.onclick = null;
            resolve(valor);
        };

        opcoes.forEach((op) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "modalBtnOpcao" + (op.perigo ? " perigo" : "");
            btn.innerText = op.texto;
            btn.onclick = () => finalizar(op.valor);
            listaOpcoes.appendChild(btn);
        });

        elCorpo.appendChild(listaOpcoes);

        const btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.className = "modalBtnCancelar";
        btnCancelar.innerText = "Cancelar";
        btnCancelar.onclick = () => finalizar(null);
        elBotoes.appendChild(btnCancelar);

        btnFechar.onclick = () => finalizar(null);
        modal.onclick = (e) => {
            if (e.target === modal) finalizar(null);
        };

        modal.style.display = "flex";
    });
}

function abrirModalFormulario({ titulo, texto = "", campos = [], textoConfirmar = "Salvar" }) {
    return new Promise((resolve) => {
        const modal = document.getElementById("modalApp");
        const elTitulo = document.getElementById("modalTitulo");
        const elTexto = document.getElementById("modalTexto");
        const elCorpo = document.getElementById("modalCorpo");
        const elBotoes = document.getElementById("modalBotoes");
        const btnFechar = document.getElementById("modalFechar");

        elTitulo.innerText = titulo;
        elTexto.innerText = texto;
        elCorpo.innerHTML = "";
        elBotoes.innerHTML = "";

        const inputs = {};

        campos.forEach((campo, indice) => {
            const grupo = document.createElement("div");
            grupo.className = "modalCampo";

            const label = document.createElement("label");
            label.innerText = campo.maxLength
                ? `${campo.label} (máx. ${campo.maxLength})`
                : campo.label;

            const input = document.createElement("input");
            input.type = campo.type || "text";
            input.value = campo.valorInicial || "";
            input.placeholder = campo.placeholder || "";
            if (campo.maxLength) {
                input.maxLength = campo.maxLength;
            }
            if (campo.inputmode) {
                input.setAttribute("inputmode", campo.inputmode);
            }

            grupo.appendChild(label);
            grupo.appendChild(input);
            elCorpo.appendChild(grupo);

            inputs[campo.id] = input;

            if (indice === 0) {
                setTimeout(() => input.focus(), 50);
            }
        });

        const finalizar = (resultado) => {
            modal.style.display = "none";
            modal.onclick = null;
            btnFechar.onclick = null;
            resolve(resultado);
        };

        const confirmar = () => {
            const valores = {};
            for (const campo of campos) {
                valores[campo.id] = inputs[campo.id].value;
            }
            finalizar(valores);
        };

        Object.values(inputs).forEach((input) => {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    confirmar();
                }
            });
        });

        const btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.className = "modalBtnCancelar";
        btnCancelar.innerText = "Cancelar";
        btnCancelar.onclick = () => finalizar(null);

        const btnSalvar = document.createElement("button");
        btnSalvar.type = "button";
        btnSalvar.className = "modalBtnConfirmar";
        btnSalvar.innerText = textoConfirmar;
        btnSalvar.onclick = confirmar;

        elBotoes.appendChild(btnCancelar);
        elBotoes.appendChild(btnSalvar);

        btnFechar.onclick = () => finalizar(null);
        modal.onclick = (e) => {
            if (e.target === modal) finalizar(null);
        };

        modal.style.display = "flex";
    });
}

function abrirModalConfirmacao({
    titulo = "Confirmação",
    texto = "",
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    perigo = false
}) {
    return new Promise((resolve) => {
        const modal = document.getElementById("modalApp");
        const elTitulo = document.getElementById("modalTitulo");
        const elTexto = document.getElementById("modalTexto");
        const elCorpo = document.getElementById("modalCorpo");
        const elBotoes = document.getElementById("modalBotoes");
        const btnFechar = document.getElementById("modalFechar");

        elTitulo.innerText = titulo;
        elTexto.innerText = texto;
        elCorpo.innerHTML = "";
        elBotoes.innerHTML = "";

        const finalizar = (resultado) => {
            modal.style.display = "none";
            modal.onclick = null;
            btnFechar.onclick = null;
            resolve(resultado);
        };

        const btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.className = "modalBtnCancelar";
        btnCancelar.innerText = textoCancelar;
        btnCancelar.onclick = () => finalizar(false);

        const btnConfirmar = document.createElement("button");
        btnConfirmar.type = "button";
        btnConfirmar.className = perigo ? "modalBtnPerigo" : "modalBtnConfirmar";
        btnConfirmar.innerText = textoConfirmar;
        btnConfirmar.onclick = () => finalizar(true);

        elBotoes.appendChild(btnCancelar);
        elBotoes.appendChild(btnConfirmar);

        btnFechar.onclick = () => finalizar(false);
        modal.onclick = (e) => {
            if (e.target === modal) finalizar(false);
        };

        modal.style.display = "flex";
    });
}

function abrirModalAviso(texto, titulo = "⚠️ Atenção") {
    return new Promise((resolve) => {
        const modal = document.getElementById("modalApp");
        const elTitulo = document.getElementById("modalTitulo");
        const elTexto = document.getElementById("modalTexto");
        const elCorpo = document.getElementById("modalCorpo");
        const elBotoes = document.getElementById("modalBotoes");
        const btnFechar = document.getElementById("modalFechar");

        elTitulo.innerText = titulo;
        elTexto.innerText = texto;
        elCorpo.innerHTML = "";
        elBotoes.innerHTML = "";

        const finalizar = () => {
            modal.style.display = "none";
            modal.onclick = null;
            btnFechar.onclick = null;
            resolve();
        };

        const btnOk = document.createElement("button");
        btnOk.type = "button";
        btnOk.className = "modalBtnConfirmar";
        btnOk.innerText = "OK";
        btnOk.onclick = finalizar;

        elBotoes.appendChild(btnOk);

        btnFechar.onclick = finalizar;
        modal.onclick = (e) => {
            if (e.target === modal) finalizar();
        };

        modal.style.display = "flex";
    });
}

/* ==========================================================
   MODO PRIVACIDADE (OLHINHO)
========================================================== */

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

/* ==========================================================
   EXPORTAR PLANILHA (EXCEL / CSV)
========================================================== */

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

/* ==========================================================
   LEMBRETE AUTOMÁTICO DE BACKUP
========================================================== */

function verificarLembreteBackup() {
    const aviso = document.getElementById("avisoBackup");
    if (!aviso) return;

    const dados = carregarDados();
    if (dados.length < 3) {
        aviso.style.display = "none";
        return;
    }

    const diasLimite = 15;
    const ultimo = localStorage.getItem("ultimo_backup_controle");
    const agora = Date.now();
    const limiteMs = diasLimite * 24 * 60 * 60 * 1000;

    if (!ultimo) {
        aviso.style.display = "flex";
        aviso.querySelector(".textoAvisoBackup").innerText =
            "💾 Você ainda não fez um backup. Salve uma cópia dos seus dados!";
        return;
    }

    const diasSemBackup = Math.floor((agora - Number(ultimo)) / (24 * 60 * 60 * 1000));

    if (agora - Number(ultimo) >= limiteMs) {
        aviso.style.display = "flex";
        aviso.querySelector(".textoAvisoBackup").innerText =
            `💾 Faz ${diasSemBackup} dia(s) que você não faz backup dos seus dados.`;
    } else {
        aviso.style.display = "none";
    }
}

function fazerBackupAgora() {
    const btn = document.getElementById("btnBackup");
    if (btn) btn.click();
}

function adiarLembreteBackup() {
    const oitoDiasAtras = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem("ultimo_backup_controle", String(oitoDiasAtras));
    verificarLembreteBackup();
}