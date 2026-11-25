/* ==========================================================
   CONFIGURAÇÕES, ESTADO GLOBAL E BANCO LOCAL
========================================================== */

const STORAGE = "controle_financeiro";
const STORAGE_RECORRENTES = "controle_recorrencias";
const STORAGE_METAS = "controle_metas";
const STORAGE_CATEGORIAS = "controle_categorias";
const STORAGE_FORMAS_PAGAMENTO = "controle_formas_pagamento";

let idEdicao = null;
let mesInicioAtual = "";
let metaAtualId = null;
let expressaoCalc = "";
let filtroRapidoAtual = "todos";
let telaExtraNoHistorico = false;

/* Limite máximo de caracteres dos campos (altere só os números se quiser ajustar) */
const LIMITES_TEXTO = {
    categoria: 25,
    formaPagamento: 25,
    meta: 40,
    descricao: 50,
    observacao: 100,
    emoji: 6
};

const MSG_EXCLUIR_REGISTRO = "Deseja excluir este registro?";
const MSG_EXCLUIR_GRUPO = "Deseja excluir todas as parcelas deste lançamento?";

const categoriasPadrao = [
    { nome: "Alimentação", icone: "🍔" },
    { nome: "Transporte", icone: "🚗" },
    { nome: "Lazer", icone: "🎮" },
    { nome: "Moradia", icone: "🏠" },
    { nome: "Saúde", icone: "💊" },
    { nome: "Salário", icone: "💰" },
    { nome: "Outros", icone: "📦" }
];

const formasPagamentoPadrao = [
    { nome: "Dinheiro", icone: "💵" },
    { nome: "Cartão de débito", icone: "💳" },
    { nome: "Cartão de crédito", icone: "💳" }
];

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

/* ==========================================================
   BANCO DE DADOS LOCAL (LOCALSTORAGE)
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
    localStorage.setItem(STORAGE_RECORRENTES, JSON.stringify(recorrencias));
}

function carregarMetas() {
    return JSON.parse(localStorage.getItem(STORAGE_METAS) || "[]");
}

function salvarMetas(metas) {
    localStorage.setItem(STORAGE_METAS, JSON.stringify(metas));
}

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

/* ==========================================================
   RECORRÊNCIAS E FUNÇÕES AUXILIARES
========================================================== */

function gerarRecorrenciasDoMes(mesAlvo = null) {
    const recorrencias = carregarRecorrencias();
    const dados = carregarDados();

    if (!recorrencias.length) return;
    const mesReferencia = mesAlvo || (filtroMes ? filtroMes.value : "");
    if (!mesReferencia) return;

    const [ano, mesNumero] = mesReferencia.split("-").map(Number);
    const mes = mesNumero - 1;

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

function moeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function encontrarRegistro(dados, id) {
    return dados.find(item => String(item.id) === String(id));
}

function encontrarMeta(id) {
    const metas = carregarMetas();
    return metas.find(meta => String(meta.id) === String(id));
}