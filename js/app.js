/* ==========================================================
   CONTROLE FINANCEIRO
   APP PRINCIPAL

   PARTE 1/4
========================================================== */


/* ==========================================================
   CONFIGURAÇÕES
========================================================== */

const STORAGE = "controle_financeiro";
let idEdicao = null;

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


const inputDescricao =
    document.getElementById("descricao");

const inputValor =
    document.getElementById("valor");

const inputDataLancamento =
    document.getElementById("dataLancamento");

const selectTipo =
    document.getElementById("tipo");

const selectCategoria =
    document.getElementById("categoria");

const inputObservacao =
    document.getElementById("observacao");

const inputParcelas =
    document.getElementById("parcelas");

const selectFormaPagamento =
    document.getElementById("formaPagamento");

const totalDespesasMes =
    document.getElementById("totalDespesasMes");

const totalPendenteMes =
    document.getElementById("totalPendenteMes");

    const totalReceitasMes =
    document.getElementById("totalReceitasMes");

const saldoMes =
    document.getElementById("saldoMes");

    const saldoInicio =
    document.getElementById("saldoInicio");

const receitasInicio =
    document.getElementById("receitasInicio");

const despesasInicio =
    document.getElementById("despesasInicio");

const pendenciasInicio =
    document.getElementById("pendenciasInicio");

const mesAtualInicio =
    document.getElementById("mesAtualInicio");


const quantidadeInicio =
    document.getElementById("quantidadeInicio");

    const gastosMes =
    document.getElementById("gastosMes");

const receitasMes =
    document.getElementById("receitasMes");

const resultadoMes =
    document.getElementById("resultadoMes");

const maiorGasto =
    document.getElementById("maiorGasto");

    const campoValor = document.getElementById("valor");

function calcularExpressao(valor) {

    let expressao = valor
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


filtroMes.addEventListener(
    "change",
    () => {

        atualizarMesExibido();

        renderizar();

    }
);

function atualizarMesExibido() {

    if (!filtroMes.value) return;

    const [ano, mes] = filtroMes.value.split("-");

    const data = new Date(
        Number(ano),
        Number(mes) - 1,
        1
    );

    const nomeMes = data.toLocaleDateString(
        "pt-BR",
        {
            month: "long",
            year: "numeric"
        }
    );

    const mesExibido =
        document.getElementById("mesExibido");

    if (mesExibido) {

        mesExibido.innerText =
            nomeMes.charAt(0).toUpperCase()
            + nomeMes.slice(1);

    }

}


function mudarMes(direcao) {

    if (!filtroMes.value) return;

    const [ano, mes] =
        filtroMes.value.split("-").map(Number);

    const data =
        new Date(ano, mes - 1, 1);

    data.setMonth(
        data.getMonth() + direcao
    );

    const novoAno =
        data.getFullYear();

    const novoMes =
        String(data.getMonth() + 1)
            .padStart(2, "0");

    filtroMes.value =
        `${novoAno}-${novoMes}`;

    atualizarMesExibido();

    renderizar();

}

buscar.addEventListener(
    "input",
    renderizar
);

ordenacao.addEventListener(
    "change",
    renderizar
);

parcelado.addEventListener(
    "change",
    () => {

        areaParcelas.style.display =
            parcelado.value === "sim"
                ? "block"
                : "none";

    }
);



/* ==========================================================
   BANCO DE DADOS LOCAL
========================================================== */


function carregarDados(){

    return JSON.parse(
        localStorage.getItem(STORAGE)
        || "[]"
    );

}



function salvarDados(dados){

    localStorage.setItem(
        STORAGE,
        JSON.stringify(dados)
    );

}



function gerarID(){

    return Date.now()
        +
        Math.random();

}



/* ==========================================================
   FUNÇÕES AUXILIARES
========================================================== */


function formatarData(data){

    const dataObj =
        new Date(data);


    return (
        dataObj.toLocaleDateString("pt-BR")
        +
        " "
        +
        dataObj.toLocaleTimeString("pt-BR")
    );

}



function encontrarRegistro(dados, id){

    return dados.find(
        item =>
            String(item.id)
            ===
            String(id)
    );

}

function editarRegistro(id){

    const dados = carregarDados();

    const registro = encontrarRegistro(dados, id);

    if(!registro){
        return;
    }

    inputDescricao.value = registro.descricao;
    expressaoCalc = String(registro.valor);

inputValor.value = expressaoCalc;

atualizarTeclado();

    inputDataLancamento.value = registro.data.split("T")[0];
    selectTipo.value = registro.tipo;
    selectCategoria.value = registro.categoria;
    inputObservacao.value = registro.observacao;

    selectFormaPagamento.value =
    registro.formaPagamento || "";

    /* Recupera a quantidade original de parcelas */

    parcelado.disabled = true;

if(registro.parcela){

    const partesParcela =
        registro.parcela.split("/");

    const quantidadeParcelas =
        Number(partesParcela[1]);

    parcelado.value = "sim";

    areaParcelas.style.display = "block";

    inputParcelas.value =
        quantidadeParcelas;

    inputParcelas.disabled = true;

}
else{

    parcelado.value = "nao";

    areaParcelas.style.display = "none";

    inputParcelas.disabled = true;

}

    idEdicao = id;

document.querySelector(".btnSalvar").innerText =
    "Atualizar Registro";

    const botaoCancelar =
    document.getElementById("btnCancelarEdicao");

if(botaoCancelar){
    botaoCancelar.style.display = "inline-block";
}

    const avisoEdicao = document.getElementById("avisoEdicao");

if (avisoEdicao) {

    avisoEdicao.innerText =
        registro.parcela
            ? `✏️ Editando: ${registro.descricao} — Parcela ${registro.parcela}`
            : `✏️ Editando: ${registro.descricao}`;

    avisoEdicao.style.display = "block";

}

/* Vai para a tela de lançamento */

mostrarTela("telaLancamentos");

/* Depois sobe para o início da tela */

window.scrollTo({
    top: 0,
    behavior: "smooth"
});

}


function moeda(valor){

    return Number(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}
function toggleMenu(id){

    document.querySelectorAll(".menuAcoes").forEach(menu=>{

        if(menu.id !== "menu-"+id){
            menu.classList.remove("aberto");
        }

    });

    document
        .getElementById("menu-"+id)
        .classList
        .toggle("aberto");

}

document.addEventListener("click", function(e){

    if(!e.target.closest(".acoesTransacao")){

        document.querySelectorAll(".menuAcoes")
        .forEach(menu=>{

            menu.classList.remove("aberto");

        });

    }

});


/* ==========================================================
   CADASTRO DE MOVIMENTAÇÃO
========================================================== */




form.addEventListener("submit", (evento) => {

    evento.preventDefault();

    const descricao =
        inputDescricao.value.trim();

    const valor =
        calcularExpressao(inputValor.value);

    if (valor === null || valor <= 0) {

        alert("Digite um valor ou uma conta válida.");

        return;

    }

    const tipo =
        selectTipo.value;

    const categoria =
        selectCategoria.value;

    const observacao =
        inputObservacao.value.trim();

    const formaPagamento =
         selectFormaPagamento.value;

    const dataEscolhida =
        inputDataLancamento.value;

    const agora =
        dataEscolhida
            ? new Date(dataEscolhida + "T12:00:00")
            : new Date();

    const dados =
        carregarDados();


    /* =====================================================
       EDIÇÃO DE LANÇAMENTO
    ===================================================== */

    if (idEdicao) {

        const registro =
            encontrarRegistro(dados, idEdicao);

        if (!registro) {
            return;
        }


        /* Guardamos os dados antigos antes de alterar */

        const grupoOriginal =
            registro.grupo;

        const dataOriginal =
            new Date(registro.data);
         
            const dataOriginalInput =
            registro.data.split("T")[0];
        
        const dataFoiAlterada =
            dataEscolhida !== dataOriginalInput;

        /* Procura todas as parcelas do mesmo grupo */

        const parcelasGrupo =
            dados
                .filter(item =>
                    item.grupo === grupoOriginal
                )
                .sort(
                    (a, b) =>
                        new Date(a.data) -
                        new Date(b.data)
                );


        let opcao;


        /* Se não for parcelado */

        if (!registro.parcela || parcelasGrupo.length === 1) {

            opcao = "esta";

        }

        else {

            opcao = prompt(
                "Como deseja aplicar a alteração?\n\n" +
                "1 - Editar somente esta\n" +
                "2 - Editar esta e as futuras\n" +
                "3 - Editar todas as parcelas\n" +
                "4 - Cancelar"
            );


            if (opcao === "4" || opcao === null) {

                return;

            }

            if (!["1", "2", "3"].includes(opcao)) {

                alert("Escolha uma opção válida.");

                return;

            }

        }


        /* =================================================
           FUNÇÃO PARA APLICAR AS ALTERAÇÕES
        ================================================= */

        function aplicarAlteracoes(item, novaData, manterDataOriginal = false) {

            item.descricao = descricao;
        
            item.valor = valor;
        
            item.tipo = tipo;
        
            item.categoria = categoria;
        
            item.formaPagamento = formaPagamento;
        
            item.observacao = observacao;
        
        
            /*
             * Só altera a data se realmente for necessário.
             */
        
            if (!manterDataOriginal) {
        
                item.data = novaData.toISOString();
        
            }
        
        }

        /* =================================================
           SOMENTE ESTA PARCELA
        ================================================= */

        if (opcao === "esta") {

            aplicarAlteracoes(
                registro,
                agora,
                !dataFoiAlterada
            );
        
        }

        /* =================================================
           ESTA + FUTURAS
        ================================================= */

        else if (opcao === "2") {

            const indiceAtual =
                parcelasGrupo.findIndex(
                    item =>
                        String(item.id) ===
                        String(registro.id)
                );
        
        
            parcelasGrupo
                .slice(indiceAtual)
                .forEach((item, indice) => {
        
                    /*
                     * Se a data não foi alterada,
                     * mantém exatamente a data original
                     * de cada parcela.
                     */
        
                    if (!dataFoiAlterada) {
        
                        aplicarAlteracoes(
                            item,
                            new Date(item.data),
                            true
                        );
        
                        return;
        
                    }
        
        
                    /*
                     * Se a data foi alterada,
                     * recalcula as parcelas futuras
                     * a partir da nova data.
                     */
        
                    const novaData =
                        new Date(agora);
        
                    novaData.setMonth(
                        novaData.getMonth() + indice
                    );
        
                    aplicarAlteracoes(
                        item,
                        novaData
                    );
        
                });
        
        }

        /* =================================================
           TODAS AS PARCELAS
        ================================================= */

        else if (opcao === "3") {

            parcelasGrupo.forEach(
                (item, indice) => {
        
                    /*
                     * Se a data não foi alterada,
                     * mantém a data original de cada parcela.
                     */
        
                    if (!dataFoiAlterada) {
        
                        aplicarAlteracoes(
                            item,
                            new Date(item.data),
                            true
                        );
        
                        return;
        
                    }
        
        
                    /*
                     * Se a data foi alterada,
                     * reorganiza as datas das parcelas.
                     */
        
                    const novaData =
                        new Date(agora);
        
                    novaData.setMonth(
                        novaData.getMonth() + indice
                    );
        
                    aplicarAlteracoes(
                        item,
                        novaData
                    );
        
                }
            );
        
        }


        idEdicao = null;


        document.querySelector(".btnSalvar").innerText =
            "Salvar Registro";


        salvarDados(dados);

        limparFormulario();

        atualizarInicio();

        renderizar();


        const msg =
            document.getElementById("mensagem");

        msg.innerText =
            "Registro atualizado com sucesso!";

        msg.style.color =
            "green";

        setTimeout(() => {
            msg.innerText = "";
        }, 3000);


        return;

    }


    /* =====================================================
       NOVO LANÇAMENTO
    ===================================================== */

    const confirmar =
    confirm(
        `Deseja salvar este lançamento?\n\n` +
        `Descrição: ${descricao}\n` +
        `Valor: R$ ${moeda(valor)}\n` +
        `Categoria: ${categoria}\n` +
        `Parcelado: ${
            parcelado.value === "sim"
            ? inputParcelas.value + "x"
            : "Não"
        }`
    );


    if (!confirmar) {
        return;
    }


    const grupoID =
        String(
            Date.now() +
            Math.random()
        );


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

    }

    else {

        dados.push({

            id:
                String(gerarID()),

            grupo:
                grupoID,

            descricao,

            valor,

            tipo,

            categoria,

            formaPagamento,

            observacao,

            parcela: "",

            status:
                "pendente",

            data:
                agora.toISOString()

        });

    }


    salvarDados(dados);


    limparFormulario();


    atualizarInicio();

    renderizar();


    const msg =
        document.getElementById("mensagem");

    msg.innerText =
        "Registro salvo com sucesso!";

    msg.style.color =
        "green";


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
}){

    const quantidade =
        Number(inputParcelas.value);

    const valorParcela =
        Number(valor);

    const diaOriginal =
        agora.getDate();


    for(
        let i = 0;
        i < quantidade;
        i++
    ){

        const ano =
            agora.getFullYear();

        const mes =
            agora.getMonth() + i;


        /*
         * Descobre o último dia do mês
         */
        const ultimoDiaDoMes =
            new Date(
                ano,
                mes + 1,
                0
            ).getDate();


        /*
         * Mantém o dia original,
         * mas ajusta caso o mês não possua esse dia.
         */
        const dia =
            Math.min(
                diaOriginal,
                ultimoDiaDoMes
            );


        const dataParcela =
            new Date(
                ano,
                mes,
                dia,
                12,
                0,
                0
            );


        dados.push({

            id:
                String(gerarID()),

            grupo:
                grupoID,

            descricao,

            valor:
                valorParcela,

            tipo,

            categoria,

            formaPagamento,

            observacao,

            parcela:
                `${i + 1}/${quantidade}`,

            status:
                "pendente",

            data:
                dataParcela.toISOString()

        });

    }

}


/* ==========================================================
   LIMPAR FORMULÁRIO
========================================================== */


function limparFormulario(){

    form.reset();

    // Limpa completamente o campo de valor e a calculadora
    inputValor.value = "";
    expressaoCalc = "";

    const resultadoTeclado =
        document.getElementById("resultadoTeclado");

    if(resultadoTeclado){
        resultadoTeclado.innerText = "R$ 0,00";
    }

    areaParcelas.style.display =
        "none";

    inputParcelas.value =
        2;
        inputParcelas.disabled = false;
        parcelado.disabled = false;

    inputDataLancamento.value =
        new Date()
            .toISOString()
            .split("T")[0];

    idEdicao = null;

    document.querySelector(".btnSalvar").innerText =
        "Salvar Registro";

        const botaoCancelar =
    document.getElementById("btnCancelarEdicao");

if(botaoCancelar){
    botaoCancelar.style.display = "none";
}

}

function cancelarEdicao(){

    idEdicao = null;

    limparFormulario();

    const aviso =
        document.getElementById("avisoEdicao");

    if(aviso){
        aviso.innerText = "";
        aviso.style.display = "none";
    }

    const botaoCancelar =
        document.getElementById("btnCancelarEdicao");

    if(botaoCancelar){
        botaoCancelar.style.display = "none";
    }

    mostrarTela("telaResumo");

}

/* ==========================================================
   CRIAÇÃO VISUAL DAS TRANSAÇÕES
========================================================== */


function criarTransacao(item){


    const div =
        document.createElement("div");


    div.className =
        "transacao";


    const dataHora =
        formatarData(item.data);



        div.innerHTML = `

        <div class="linha">
        
            <div>
        
                <div class="titulo">
                    ${item.descricao}
                </div>
        
        
                <div class="info">

    ${item.categoria}

    ${
        item.formaPagamento
        ? " • " + item.formaPagamento
        : ""
    }

    • 

    ${new Date(item.data).toLocaleDateString("pt-BR")}

    ${
        item.parcela
        ?
        " • " + item.parcela
        :
        ""
    }

</div>


<div class="info observacaoCompacta">

    Obs:

    <span
        class="campoObservacao"
        contenteditable="true"
        onblur="salvarObservacao('${item.id}', this.innerText)"
    >${item.observacao || "Adicionar observação..."}</span>

</div>
        
            </div>
        
        
        
            <div>
        
                <div class="${
                    item.tipo === "receita"
                    ?
                    "valorReceita"
                    :
                    "valorDespesa"
                }">
        
                    R$ ${moeda(item.valor)}
        
                </div>
        
            </div>
        
        
        </div>
        
        
        
        <div class="acoesTransacao">
        
        <button
            onclick="alterarStatus('${item.id}')"
            class="${
                item.status === "pago"
                ?
                "btnPago"
                :
                "btnPagar"
            }"
        >
        
        ${
            item.status === "pago"
            ?
            "Pago"
            :
            "Pagar"
        }
        
        </button>
        
        
        <button
            class="btnMenu"
            onclick="toggleMenu('${item.id}')"
        >
        
        ⋮
        
        </button>
        
        
        <div
        class="menuAcoes"
        id="menu-${item.id}"
        >
        
        <button onclick="editarRegistro('${item.id}')">
        ✏️ Editar
        </button>
        
        <button onclick="excluirRegistro('${item.id}')">
        🗑️ Excluir
        </button>
        
        <button onclick="excluirGrupo('${item.id}')">
        🗑️ Excluir tudo
        </button>
        
        </div>
        
        
        </div>
        
        `;

    
    return div;

}

/* ==========================================================
   ATUALIZAR TELA INICIAL
========================================================== */


function atualizarInicio(){


    const dados = carregarDados();


    let receitas = 0;
    let despesas = 0;
    let pendentes = 0;

    const hoje = new Date();

    const numeroMes = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const nomeMes =
        hoje.toLocaleDateString(
            "pt-BR",
            {
                month: "long",
                year: "numeric"
            }
        );

    if(mesAtualInicio){

        mesAtualInicio.innerHTML =
            "📅 " + nomeMes;

    }

    if(quantidadeInicio){

        quantidadeInicio.innerHTML =
            "📝 Lançamentos: " + dados.length;

    }

    dados.forEach(item => {

        const data = new Date(item.data);

        if(
            data.getMonth() !== numeroMes ||
            data.getFullYear() !== anoAtual
        ){
            return;
        }

        if(item.tipo === "receita"){

            receitas += Number(item.valor);

        }

        if(item.tipo === "despesa"){

            despesas += Number(item.valor);

            if(item.status === "pendente"){

                pendentes += Number(item.valor);

            }

        }

    });

    const saldo = receitas - despesas;

    if(saldoInicio){

        saldoInicio.innerHTML =
            `📊 Saldo do mês: R$ ${moeda(saldo)}`;

    }

    if(receitasInicio){

        receitasInicio.innerHTML =
            `💰 Receitas: R$ ${moeda(receitas)}`;

    }

    if(despesasInicio){

        despesasInicio.innerHTML =
            `💸 Despesas: R$ ${moeda(despesas)}`;

    }

    if(pendenciasInicio){

        pendenciasInicio.innerHTML =
            `⚠️ Pendentes do mês: R$ ${moeda(pendentes)}`;

    }

    atualizarResumoInteligente();


}

function atualizarResumoInteligente(){

    const dados = carregarDados();


    const hoje = new Date();


    const mesAtual = hoje.getMonth();

    const anoAtual = hoje.getFullYear();


    let gastos = 0;
    let receitas = 0;


    let categorias = {};
    let pagamentos = {};


    dados.forEach(item => {


        const data = new Date(item.data);


        if(
            data.getMonth() === mesAtual &&
            data.getFullYear() === anoAtual
        ){


            if(item.tipo === "despesa"){

                gastos += Number(item.valor);


                categorias[item.categoria] =
                (categorias[item.categoria] || 0)
                +
                Number(item.valor);

                    const pagamento = item.formaPagamento || "Não informado";

    pagamentos[pagamento] =
        (pagamentos[pagamento] || 0)
        + Number(item.valor);


            }
            

            if(item.tipo === "receita"){

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




    if(gastosMes){

        gastosMes.innerHTML =
        `R$ ${moeda(gastos)}`;
    
    }


    if(receitasMes){

        receitasMes.innerHTML =
        `R$ ${moeda(receitas)}`;
    
    }


    if(resultadoMes){

        resultadoMes.innerHTML =
        `📊 Resultado: R$ ${moeda(receitas - gastos)}`;

    }



    const cardMaiorGasto = document.getElementById("maiorGasto");

if(cardMaiorGasto){

    cardMaiorGasto.innerHTML =
        `🏆 Maior gasto: ${categoriaMaior} • R$ ${moeda(valorMaior)}`;

}

const resumoCategorias =
    document.getElementById("resumoCategorias");

if(resumoCategorias){

    resumoCategorias.innerHTML =
    Object.entries(categorias)
    .map(([categoria, valor]) => {

        const porcentagem =
            gastos > 0
            ? Math.round((valor / gastos) * 100)
            : 0;

        return `
            <div class="linhaResumo">
                <span>🏷️ ${categoria}</span>
                <span>
                    R$ ${moeda(valor)}
                    <strong>${porcentagem}%</strong>
                </span>
            </div>
        `;

    })
    .join("") || "Nenhum gasto registrado.";

}


const resumoPagamentos =
    document.getElementById("resumoPagamentos");

if(resumoPagamentos){

    resumoPagamentos.innerHTML =
    Object.entries(pagamentos)
    .map(([pagamento, valor]) => {

        const porcentagem =
            gastos > 0
            ? Math.round((valor / gastos) * 100)
            : 0;

        return `
            <div class="linhaResumo">
                <span>💳 ${pagamento}</span>
                <span>
                    R$ ${moeda(valor)}
                    <strong>${porcentagem}%</strong>
                </span>
            </div>
        `;

    })
    .join("") || "Nenhum gasto registrado.";

}
console.log("CATEGORIAS:", categorias);
console.log("PAGAMENTOS:", pagamentos);

}



/* ==========================================================
   RENDERIZAÇÃO DO HISTÓRICO
========================================================== */


function renderizar(){


    let dados =
        carregarDados();



        let totalDespesas = 0;

        let totalReceitas = 0;
        
        let totalPendente = 0;



    if(filtroMes.value){


        dados =
            dados.filter(item => {


                const data =
                    new Date(item.data);


                const ano =
                    data.getFullYear();


                const mes =
                    String(
                        data.getMonth() + 1
                    )
                    .padStart(2, "0");



                return (
                    `${ano}-${mes}`
                    ===
                    filtroMes.value
                );


            });

    }




    if(buscar.value.trim() !== ""){


        const texto =
            buscar.value
                .toLowerCase()
                .trim();
    
    
    
        dados =
            dados.filter(item => {
    
    
                const descricao =
                    item.descricao
                    ?.toLowerCase()
                    || "";
    
    
                const categoria =
                    item.categoria
                    ?.toLowerCase()
                    || "";
    
    
                const observacao =
                    item.observacao
                    ?.toLowerCase()
                    || "";
    
    
                const tipo =
                    item.tipo
                    ?.toLowerCase()
                    || "";
    
    
    
                return (
    
                    descricao.includes(texto)
    
                    ||
    
                    categoria.includes(texto)
    
                    ||
    
                    observacao.includes(texto)
    
                    ||
    
                    tipo.includes(texto)
    
                );
    
    
            });
    
    
    }





    dados.forEach(item => {

        if(item.tipo === "receita"){

            totalReceitas += Number(item.valor);
        
        }

        if(item.tipo === "despesa"){


            totalDespesas +=
                Number(item.valor);



            if(item.status === "pendente"){


                totalPendente +=
                    Number(item.valor);


            }

        }


    });





    dados.sort(
        (a, b) => {
    
    
            if(ordenacao.value === "maiorValor"){
    
                return b.valor - a.valor;
    
            }
    
    
            if(ordenacao.value === "menorValor"){
    
                return a.valor - b.valor;
    
            }
    
    
            if(ordenacao.value === "pendente"){
    
                return (
                    a.status === "pago"
                )
                -
                (
                    b.status === "pago"
                );
    
            }
    
    
            return (
                new Date(b.data)
                -
                new Date(a.data)
            );
    
    
        }
    );





    lista.innerHTML = "";



    totalDespesasMes.innerHTML =

        `💸 Total de despesas: R$ ${moeda(totalDespesas)}`;

        totalReceitasMes.innerHTML =
    `💰 Total de receitas: R$ ${moeda(totalReceitas)}`;


saldoMes.innerHTML =
    `📊 Saldo: R$ ${moeda(totalReceitas - totalDespesas)}`;



    totalPendenteMes.innerHTML =

        `⚠️ Pendente: R$ ${moeda(totalPendente)}`;





    if(dados.length === 0){


        lista.innerHTML =
            "<p>Nenhum registro encontrado.</p>";


        return;

    }





    dados.forEach(item => {


        const div =
            criarTransacao(item);



        if(item.status === "pago"){


            div.style.borderLeft =
                "5px solid #43a047";


        }

        else{


            div.style.borderLeft =
                "5px solid #fbc02d";


        }



        lista.appendChild(div);


    });


}

/* ==========================================================
   ALTERAR STATUS
========================================================== */


function alterarStatus(id){


    const dados =
        carregarDados();



    const registro =
        encontrarRegistro(
            dados,
            id
        );



    if(!registro){

        return;

    }



    registro.status =
        registro.status === "pago"
            ?
            "pendente"
            :
            "pago";



            salvarDados(dados);


            atualizarInicio();
            
            
            renderizar();


}





/* ==========================================================
   EXCLUIR REGISTRO INDIVIDUAL
========================================================== */


function excluirRegistro(id){


    if(
        !confirm(MSG_EXCLUIR_REGISTRO)
    ){

        return;

    }



    let dados =
        carregarDados();



    dados =
        dados.filter(
            item =>
                String(item.id)
                !==
                String(id)
        );



        salvarDados(dados);


        atualizarInicio();
        
        
        renderizar();


}





/* ==========================================================
   EXCLUIR GRUPO DE PARCELAS
========================================================== */


function excluirGrupo(id){


    const dados =
        carregarDados();



    const registro =
        encontrarRegistro(
            dados,
            id
        );



    if(!registro){

        return;

    }



    if(
        !confirm(MSG_EXCLUIR_GRUPO)
    ){

        return;

    }



    const novosDados =
        dados.filter(
            item =>
                item.grupo
                !==
                registro.grupo
        );



        salvarDados(novosDados);


        atualizarInicio();
        
        
        renderizar();


}





/* ==========================================================
   SALVAR OBSERVAÇÃO
========================================================== */


function salvarObservacao(
    id,
    texto
){


    const dados =
        carregarDados();



    const registro =
        encontrarRegistro(
            dados,
            id
        );



    if(!registro){

        return;

    }



    registro.observacao =
        texto.trim();



    salvarDados(dados);


}





/* ==========================================================
   LIMPAR FILTRO
========================================================== */


function limparFiltro(){


    filtroMes.value =
        "";


    renderizar();


}





/* ==========================================================
   INICIALIZAÇÃO DO APP
========================================================== */


function iniciarApp(){

    inputDataLancamento.value =
    new Date()
        .toISOString()
        .split("T")[0];

    const hoje = new Date();

    filtroMes.value =
        hoje.getFullYear()
        + "-"
        + String(
            hoje.getMonth() + 1
        ).padStart(2, "0");

    atualizarMesExibido();

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


if(botaoTema){

    botaoTema.addEventListener("click", () => {

        document.body.classList.toggle("dark");


        if(document.body.classList.contains("dark")){

            localStorage.setItem(
                "tema",
                "dark"
            );

            botaoTema.innerText = "☀️ Tema claro";

        }

        else{

            localStorage.setItem(
                "tema",
                "light"
            );

            botaoTema.innerText = "🌙 Tema escuro";

        }

    });

}


/* CARREGAR TEMA SALVO */

const temaSalvo =
    localStorage.getItem("tema");


if(temaSalvo === "dark"){

    document.body.classList.add("dark");

    if(botaoTema){

        botaoTema.innerText = "☀️ Tema claro";
    
    }

}

/* ==========================================================
   NAVEGAÇÃO ENTRE TELAS
========================================================== */




    function mostrarTela(id, botao = null){

        console.log("Mudando para:", id);
    

    document
    .querySelectorAll(".tela")
    .forEach(tela => {

        tela.classList.remove("ativa");

    });

    // Atualiza dados ao abrir o resumo
if(id === "telaResumo"){

    renderizar();

}


    const tela =
        document.getElementById(id);


    if(tela){

        tela.classList.add("ativa");

    }



    document
    .querySelectorAll(".itemMenu")
    .forEach(item => {

        item.classList.remove("ativo");

    });



    if(botao){

        botao.classList.add("ativo");

    }

    else{

        const mapa = {

            telaInicio: 0,
        
            telaLancamentos: 1,
        
            telaResumo: 2,
        
            telaMetas: 3,
        
            telaConfiguracoes: 4
        
        };


        const indice = mapa[id];


        if(indice !== undefined){


            document
            .querySelectorAll(".itemMenu")[indice]
            .classList
            .add("ativo");


        }

    }


}

/* ==========================================================
   BACKUP
========================================================== */

const botaoBackup =
    document.getElementById("btnBackup");


if(botaoBackup){

    botaoBackup.addEventListener("click", () => {

        const dados = carregarDados();

const metas = carregarMetas();

const arquivo =
    JSON.stringify(
        {
            lancamentos: dados,
            metas: metas
        },
        null,
        2
    );

        const blob =
            new Blob(
                [arquivo],
                {
                    type:"application/json"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "backup_controle_financeiro.json";

        link.click();

        URL.revokeObjectURL(url);

    });

}

/* ==========================================================
   RESTAURAR BACKUP
========================================================== */


const botaoRestaurar =
    document.getElementById("btnRestaurar");


const arquivoBackup =
    document.getElementById("arquivoBackup");



if(botaoRestaurar){


    botaoRestaurar.addEventListener("click", () => {


        arquivoBackup.click();


    });


}



if(arquivoBackup){


    arquivoBackup.addEventListener("change", (evento) => {


        const arquivo =
            evento.target.files[0];


        if(!arquivo){

            return;

        }



        const leitor =
            new FileReader();



        leitor.onload = function(e){


            try{


                const dados =
    JSON.parse(
        e.target.result
    );


if(Array.isArray(dados)){

    salvarDados(dados);

}
else{

    salvarDados(
        dados.lancamentos || []
    );

    salvarMetas(
        dados.metas || []
    );

}


                alert(
                    "Backup restaurado com sucesso!"
                );



                atualizarInicio();

                renderizar();



            }


            catch{


                alert(
                    "Arquivo de backup inválido!"
                );


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


/* ==========================================================
   DADOS DAS METAS
========================================================== */

function carregarMetas(){

    return JSON.parse(
        localStorage.getItem(STORAGE_METAS)
        || "[]"
    );

}


function salvarMetas(metas){

    localStorage.setItem(
        STORAGE_METAS,
        JSON.stringify(metas)
    );

}


function encontrarMeta(id){

    const metas = carregarMetas();

    return metas.find(
        meta =>
            String(meta.id) === String(id)
    );

}


/* ==========================================================
   FORMULÁRIO DE NOVA META
========================================================== */

function abrirFormularioMeta(){

    const nome =
        prompt("Qual é o nome da meta?");

    if(!nome || !nome.trim()){

        return;

    }


    const valorTexto =
        prompt(
            "Qual é o valor que você quer atingir?\n\nExemplo: 5000,00"
        );


    if(!valorTexto){

        return;

    }


    const valorMeta =
        Number(
            valorTexto
                .replace(/\./g, "")
                .replace(",", ".")
        );


    if(!valorMeta || valorMeta <= 0){

        alert(
            "Digite um valor de meta válido."
        );

        return;

    }


    const metas =
        carregarMetas();


    metas.push({

        id: String(gerarID()),

        nome: nome.trim(),

        valorMeta: valorMeta,

        aportes: []

    });


    salvarMetas(metas);


    renderizarMetas();

}


/* ==========================================================
   RENDERIZAR METAS
========================================================== */

function renderizarMetas(){

    const lista =
        document.getElementById("listaMetas");


    if(!lista){

        return;

    }


    const metas =
        carregarMetas();


    lista.innerHTML = "";


    if(metas.length === 0){

        lista.innerHTML = `

          <div class="card">

            <p>
              Você ainda não possui nenhuma meta.
            </p>

            <p style="margin-top:8px;color:#777;">
              Crie sua primeira meta acima.
            </p>

          </div>

        `;

        return;

    }


    metas.forEach(meta => {

        const atual =
            meta.aportes.reduce(
                (total, aporte) =>
                    total + Number(aporte.valor),
                0
            );


        const faltante =
            Math.max(
                meta.valorMeta - atual,
                0
            );


        const porcentagem =
            Math.min(
                (atual / meta.valorMeta) * 100,
                100
            );


        const div =
            document.createElement("div");


        div.className =
            "cardMeta";


        div.onclick = function(){

            abrirMeta(meta.id);

        };


        div.innerHTML = `

          <div class="nomeMeta">

            🎯 ${meta.nome}

          </div>


          <div class="valoresMeta">

            <div class="valorAtualMeta">

              Atual:
              R$ ${moeda(atual)}

            </div>


            <div class="valorObjetivoMeta">

              Meta:
              R$ ${moeda(meta.valorMeta)}

            </div>


            <div class="valorFaltanteMeta">

              ${
                faltante > 0
                ?
                "Faltam: R$ " + moeda(faltante)
                :
                "Meta atingida! 🎉"
              }

            </div>

          </div>


          <div class="barraMeta">

            <div
              class="progressoMeta"
              style="width:${porcentagem}%">

            </div>

          </div>


          <div class="porcentagemMeta">

            ${porcentagem.toFixed(0)}%

          </div>

        `;


        lista.appendChild(div);

    });

}


/* ==========================================================
   ABRIR DETALHES DA META
========================================================== */

function abrirMeta(id){

    metaAtualId = id;


    const meta =
        encontrarMeta(id);


    if(!meta){

        return;

    }


    document.getElementById(
        "tituloMetaDetalhe"
    ).innerText =
        "🎯 " + meta.nome;


    renderizarDetalheMeta();


    mostrarTela(
        "telaDetalheMeta"
    );

}


/* ==========================================================
   DETALHES DA META
========================================================== */

function renderizarDetalheMeta(){

    const meta =
        encontrarMeta(metaAtualId);


    if(!meta){

        return;

    }


    const atual =
        meta.aportes.reduce(
            (total, aporte) =>
                total + Number(aporte.valor),
            0
        );


    const faltante =
        Math.max(
            meta.valorMeta - atual,
            0
        );


    const porcentagem =
        Math.min(
            (atual / meta.valorMeta) * 100,
            100
        );


    const resumo =
        document.getElementById(
            "resumoMetaDetalhe"
        );


    resumo.innerHTML = `

      <div class="valoresMeta">

        <div class="valorAtualMeta">

          💰 Atual:
          R$ ${moeda(atual)}

        </div>


        <div class="valorObjetivoMeta">

          🎯 Meta:
          R$ ${moeda(meta.valorMeta)}

        </div>


        <div class="valorFaltanteMeta">

          ${
            faltante > 0
            ?
            "📌 Faltam: R$ " + moeda(faltante)
            :
            "🎉 Meta atingida!"
          }

        </div>


        <div class="barraMeta">

          <div
            class="progressoMeta"
            style="width:${porcentagem}%">

          </div>

        </div>


        <div class="porcentagemMeta">

          ${porcentagem.toFixed(0)}% concluído

        </div>

      </div>

    `;


    renderizarHistoricoMeta();

}


/* ==========================================================
   HISTÓRICO DA META
========================================================== */

function renderizarHistoricoMeta(){

    const area =
        document.getElementById(
            "historicoMeta"
        );


    if(!area){

        return;

    }


    const meta =
        encontrarMeta(metaAtualId);


    if(!meta){

        return;

    }


    area.innerHTML = "";


    if(meta.aportes.length === 0){

        area.innerHTML =
            "<p>Nenhum valor adicionado ainda.</p>";

        return;

    }


    const aportes =
        [...meta.aportes]
        .sort(
            (a,b) =>
                new Date(b.data)
                -
                new Date(a.data)
        );


    aportes.forEach(aporte => {

        const div =
            document.createElement("div");


        div.className =
            "itemHistoricoMeta";


        div.innerHTML = `

          <div>

            <div class="valorHistoricoMeta">

              + R$ ${moeda(aporte.valor)}

            </div>

            <div class="dataHistoricoMeta">

              ${formatarData(aporte.data)}

            </div>

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


/* ==========================================================
   ADICIONAR VALOR NA META
========================================================== */

const formAporteMeta =
    document.getElementById(
        "formAporteMeta"
    );


if(formAporteMeta){

    formAporteMeta.addEventListener(
        "submit",
        function(evento){

            evento.preventDefault();


            if(!metaAtualId){

                return;

            }


            const campo =
                document.getElementById(
                    "valorAporteMeta"
                );


            const valor =
                Number(
                    campo.value
                        .replace(/\./g, "")
                        .replace(",", ".")
                );


            if(!valor || valor <= 0){

                alert(
                    "Digite um valor válido."
                );

                return;

            }


            const metas =
                carregarMetas();


            const meta =
                metas.find(
                    item =>
                        String(item.id)
                        ===
                        String(metaAtualId)
                );


            if(!meta){

                return;

            }


            meta.aportes.push({

                id: String(gerarID()),

                valor: valor,

                data: new Date().toISOString()

            });


            salvarMetas(metas);


            campo.value = "";


            renderizarDetalheMeta();

            renderizarMetas();


            const mensagem =
                document.getElementById(
                    "mensagemMeta"
                );


            mensagem.innerText =
                "Valor adicionado com sucesso!";


            mensagem.style.color =
                "green";


            setTimeout(() => {

                mensagem.innerText = "";

            }, 3000);

        }
    );

}


/* ==========================================================
   EXCLUIR APORTE
========================================================== */

function excluirAporte(id){

    if(
        !confirm(
            "Deseja excluir este valor?"
        )
    ){

        return;

    }


    const metas =
        carregarMetas();


    const meta =
        metas.find(
            item =>
                String(item.id)
                ===
                String(metaAtualId)
        );


    if(!meta){

        return;

    }


    meta.aportes =
        meta.aportes.filter(
            aporte =>
                String(aporte.id)
                !==
                String(id)
        );


    salvarMetas(metas);


    renderizarDetalheMeta();

    renderizarMetas();

}


/* ==========================================================
   EXCLUIR META
========================================================== */

function excluirMetaAtual(){

    const meta =
        encontrarMeta(metaAtualId);


    if(!meta){

        return;

    }


    if(
        !confirm(
            `Deseja excluir a meta "${meta.nome}"?\n\nTodos os valores registrados nela também serão excluídos.`
        )
    ){

        return;

    }


    let metas =
        carregarMetas();


    metas =
        metas.filter(
            item =>
                String(item.id)
                !==
                String(metaAtualId)
        );


    salvarMetas(metas);


    metaAtualId = null;


    mostrarTela(
        "telaMetas"
    );


    renderizarMetas();

}


/* ==========================================================
   ATUALIZAR METAS AO ABRIR A TELA
========================================================== */

const mostrarTelaOriginal =
    mostrarTela;


mostrarTela = function(
    id,
    botao = null
){

    mostrarTelaOriginal(
        id,
        botao
    );


    if(id === "telaMetas"){

        renderizarMetas();

    }


    if(id === "telaDetalheMeta"){

        renderizarDetalheMeta();

    }

};

/* ==========================================================
   CALCULADORA DO CAMPO VALOR
========================================================== */

let expressaoCalc = "";

function teclaCalc(tecla) {

    expressaoCalc += tecla;

    document.getElementById("valor").value =
        expressaoCalc;

    const resultado =
        calcularExpressao(expressaoCalc);

    document.getElementById("resultadoTeclado").innerText =
        resultado !== null
            ? "R$ " + moeda(resultado)
            : expressaoCalc;

}


function apagarCalc() {

    expressaoCalc =
        expressaoCalc.slice(0, -1);

    document.getElementById("valor").value =
        expressaoCalc;

    atualizarTeclado();

}


function limparCalc() {

    expressaoCalc = "";

    document.getElementById("valor").value = "";

    document.getElementById("resultadoTeclado").innerText =
        "R$ 0,00";

}


function atualizarTeclado() {

    const resultado =
        calcularExpressao(expressaoCalc);

    document.getElementById("resultadoTeclado").innerText =
        resultado !== null
            ? "R$ " + moeda(resultado)
            : expressaoCalc || "R$ 0,00";

}


function finalizarCalc() {

    const resultado =
        calcularExpressao(expressaoCalc);

    if (resultado === null) {

        alert("Conta inválida.");

        return;

    }

    expressaoCalc =
        String(resultado);

    document.getElementById("valor").value =
        moeda(resultado);

    document.getElementById("resultadoTeclado").innerText =
        "R$ " + moeda(resultado);

}

document.addEventListener("click", function(evento) {

    const teclado = document.getElementById("tecladoValor");

    if (!teclado) return;

    if (
        !teclado.contains(evento.target) &&
        evento.target.id !== "valor"
    ) {
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

function carregarCategorias(){

    let categorias =
        JSON.parse(
            localStorage.getItem(STORAGE_CATEGORIAS)
            || "null"
        );

    if(!categorias){

        categorias = categoriasPadrao;

        localStorage.setItem(
            STORAGE_CATEGORIAS,
            JSON.stringify(categorias)
        );

    }

    return categorias;
}


function salvarCategorias(categorias){

    localStorage.setItem(
        STORAGE_CATEGORIAS,
        JSON.stringify(categorias)
    );

}


function renderizarCategorias(){

    const lista =
        document.getElementById("listaCategorias");

    if(!lista){
        return;
    }

    const categorias =
        carregarCategorias();

    lista.innerHTML = "";

    categorias.forEach((categoria, index) => {

        const div =
            document.createElement("div");

        div.className = "card";

        div.innerHTML = `
            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:10px;
            ">

                <strong>
                    ${categoria.icone} ${categoria.nome}
                </strong>

                <div style="display:flex;gap:6px;">

                    <button
                        class="btnEditar"
                        onclick="editarCategoria(${index})">

                        ✏️

                    </button>

                    <button
                        class="btnExcluir"
                        onclick="excluirCategoria(${index})">

                        🗑️

                    </button>

                </div>

            </div>
        `;

        lista.appendChild(div);

    });

}


function adicionarCategoria(){

    const nome =
        prompt("Nome da nova categoria:");

    if(!nome || !nome.trim()){
        return;
    }

    const icone =
    prompt("Escolha um emoji para a categoria (opcional):", "");

    const categorias =
        carregarCategorias();

    categorias.push({

        nome: nome.trim(),

        icone: icone || ""

    });

    salvarCategorias(categorias);

renderizarCategorias();

atualizarCategoriasLancamento();

}


function editarCategoria(index){

    const categorias =
        carregarCategorias();

    const categoria =
        categorias[index];

    const nomeAntigo =
        categoria.nome;

    const novoNome =
        prompt(
            "Novo nome da categoria:",
            nomeAntigo
        );

    if(!novoNome || !novoNome.trim()){
        return;
    }

    const novoIcone =
        prompt(
            "Novo emoji:",
            categoria.icone
        );

    const nomeNovo =
        novoNome.trim();

    categoria.nome =
        nomeNovo;

    categoria.icone =
        novoIcone || "";

    salvarCategorias(categorias);


    /* Atualiza os lançamentos antigos */

    const dados =
        carregarDados();

    dados.forEach(item => {

        if(item.categoria === nomeAntigo){

            item.categoria =
                nomeNovo;

        }

    });

    salvarDados(dados);


    renderizarCategorias();

    atualizarCategoriasLancamento();

    atualizarInicio();

    renderizar();

}


function excluirCategoria(index){

    const categorias =
        carregarCategorias();

    const categoria =
        categorias[index];

    const dados =
        carregarDados();

    const quantidade =
        dados.filter(
            item => item.categoria === categoria.nome
        ).length;


    if(quantidade === 0){

        if(!confirm(
            `Excluir a categoria "${categoria.nome}"?`
        )){
            return;
        }

        categorias.splice(index, 1);

        salvarCategorias(categorias);

        renderizarCategorias();

        atualizarCategoriasLancamento();

        return;

    }


    const opcao =
        prompt(
            `A categoria "${categoria.nome}" possui ${quantidade} lançamento(s).\n\n` +
            `Digite:\n\n` +
            `1 - Transferir para outra categoria\n` +
            `2 - Manter os lançamentos sem categoria\n` +
            `3 - Cancelar`
        );


    if(opcao === "3" || opcao === null){
        return;
    }


    if(opcao === "1"){

        const outrasCategorias =
            categorias.filter(
                (_, i) => i !== index
            );


        if(outrasCategorias.length === 0){

            alert(
                "Não existe outra categoria para transferir os lançamentos."
            );

            return;

        }


        let texto =
            "Escolha a nova categoria:\n\n";


        outrasCategorias.forEach(
            (cat, i) => {

                texto +=
                    `${i + 1} - ${cat.icone ? cat.icone + " " : ""}${cat.nome}\n`;

            }
        );


        const escolha =
            Number(
                prompt(texto)
            );


        const novaCategoria =
            outrasCategorias[escolha - 1];


        if(!novaCategoria){

            alert("Categoria inválida.");

            return;

        }


        dados.forEach(item => {

            if(item.categoria === categoria.nome){

                item.categoria =
                    novaCategoria.nome;

            }

        });


        salvarDados(dados);

    }


    if(opcao === "2"){

        dados.forEach(item => {

            if(item.categoria === categoria.nome){

                item.categoria = "";

            }

        });


        salvarDados(dados);

    }


    if(opcao !== "1" && opcao !== "2"){

        alert("Opção inválida.");

        return;

    }


    categorias.splice(index, 1);

    salvarCategorias(categorias);

    renderizarCategorias();

    atualizarCategoriasLancamento();

    atualizarInicio();

    renderizar();

}

/* Atualizar tela de categorias */

const mostrarTelaComCategorias =
    mostrarTela;

mostrarTela = function(
    id,
    botao = null
){

    mostrarTelaComCategorias(
        id,
        botao
    );

    if(id === "telaCategorias"){

        renderizarCategorias();

    }

};

function atualizarCategoriasLancamento(){

    const select =
        document.getElementById("categoria");

    if(!select){
        return;
    }

    const valorAtual =
        select.value;

    const categorias =
        carregarCategorias();

    select.innerHTML =
        '<option value="" selected disabled>Selecione...</option>';

    categorias.forEach(categoria => {

        const option =
            document.createElement("option");

        option.value =
            categoria.nome;

        option.textContent =
            `${categoria.icone ? categoria.icone + " " : ""}${categoria.nome}`;

        select.appendChild(option);

    });

    if(categorias.some(c => c.nome === valorAtual)){

        select.value =
            valorAtual;

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


function carregarFormasPagamento(){

    let formas =
        JSON.parse(
            localStorage.getItem(STORAGE_FORMAS_PAGAMENTO)
            || "null"
        );

    if(!formas){

        formas = formasPagamentoPadrao;

        localStorage.setItem(
            STORAGE_FORMAS_PAGAMENTO,
            JSON.stringify(formas)
        );

    }

    return formas;

}


function salvarFormasPagamento(formas){

    localStorage.setItem(
        STORAGE_FORMAS_PAGAMENTO,
        JSON.stringify(formas)
    );

}


function atualizarFormasPagamentoLancamento(){

    const select =
        document.getElementById("formaPagamento");

    if(!select){
        return;
    }

    const valorAtual =
        select.value;

    const formas =
        carregarFormasPagamento();

    select.innerHTML =
        '<option value="" selected disabled>Selecione...</option>';

    formas.forEach(forma => {

        const option =
            document.createElement("option");

        option.value =
            forma.nome;

        option.textContent =
            `${forma.icone ? forma.icone + " " : ""}${forma.nome}`;

        select.appendChild(option);

    });

    if(
        formas.some(
            forma => forma.nome === valorAtual
        )
    ){

        select.value =
            valorAtual;

    }

}


function renderizarFormasPagamento(){

    const lista =
        document.getElementById(
            "listaFormasPagamento"
        );

    if(!lista){
        return;
    }

    const formas =
        carregarFormasPagamento();

    lista.innerHTML = "";

    formas.forEach((forma, index) => {

        const div =
            document.createElement("div");

        div.className =
            "card";

        div.innerHTML = `

            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:10px;
            ">

                <strong>
                    ${forma.icone} ${forma.nome}
                </strong>

                <div style="
                    display:flex;
                    gap:6px;
                ">

                    <button
                        class="btnEditar"
                        onclick="editarFormaPagamento(${index})">

                        ✏️

                    </button>

                    <button
                        class="btnExcluir"
                        onclick="excluirFormaPagamento(${index})">

                        🗑️

                    </button>

                </div>

            </div>

        `;

        lista.appendChild(div);

    });

}


function adicionarFormaPagamento(){

    const nome =
        prompt(
            "Nome da nova forma de pagamento:"
        );

    if(!nome || !nome.trim()){
        return;
    }

    const icone =
        prompt(
            "Escolha um emoji para a forma (opcional):",
            ""
        );

    const formas =
        carregarFormasPagamento();

    formas.push({

        nome:
            nome.trim(),

        icone:
            icone || ""

    });

    salvarFormasPagamento(formas);

    renderizarFormasPagamento();

    atualizarFormasPagamentoLancamento();

}


function editarFormaPagamento(index){

    const formas =
        carregarFormasPagamento();

    const forma =
        formas[index];

    const nomeAntigo =
        forma.nome;

    const novoNome =
        prompt(
            "Novo nome da forma de pagamento:",
            nomeAntigo
        );

    if(!novoNome || !novoNome.trim()){
        return;
    }

    const novoIcone =
        prompt(
            "Novo emoji:",
            forma.icone
        );

    const nomeNovo =
        novoNome.trim();

    forma.nome =
        nomeNovo;

    forma.icone =
        novoIcone || "";

    salvarFormasPagamento(formas);


    const dados =
        carregarDados();

    dados.forEach(item => {

        if(
            item.formaPagamento
            ===
            nomeAntigo
        ){

            item.formaPagamento =
                nomeNovo;

        }

    });

    salvarDados(dados);

    renderizarFormasPagamento();

    atualizarFormasPagamentoLancamento();

    atualizarInicio();

    renderizar();

}


function excluirFormaPagamento(index){

    const formas =
        carregarFormasPagamento();

    const forma =
        formas[index];

    const dados =
        carregarDados();

    const quantidade =
        dados.filter(
            item =>
                item.formaPagamento
                ===
                forma.nome
        ).length;


    if(quantidade === 0){

        if(
            !confirm(
                `Excluir a forma "${forma.nome}"?`
            )
        ){

            return;

        }

        formas.splice(index, 1);

        salvarFormasPagamento(formas);

        renderizarFormasPagamento();

        atualizarFormasPagamentoLancamento();

        return;

    }


    const opcao =
        prompt(
            `A forma "${forma.nome}" possui ${quantidade} lançamento(s).\n\n` +
            `Digite:\n\n` +
            `1 - Transferir para outra forma\n` +
            `2 - Deixar os lançamentos sem forma\n` +
            `3 - Cancelar`
        );


    if(
        opcao === "3"
        ||
        opcao === null
    ){

        return;

    }


    if(opcao === "1"){

        const outrasFormas =
            formas.filter(
                (_, i) => i !== index
            );


        if(
            outrasFormas.length === 0
        ){

            alert(
                "Não existe outra forma para transferir os lançamentos."
            );

            return;

        }


        let texto =
            "Escolha a nova forma:\n\n";


        outrasFormas.forEach(
            (forma, i) => {

                texto +=
                    `${i + 1} - ${forma.icone ? forma.icone + " " : ""}${forma.nome}\n`;

            }
        );


        const escolha =
            Number(
                prompt(texto)
            );


        const novaForma =
            outrasFormas[escolha - 1];


        if(!novaForma){

            alert(
                "Opção inválida."
            );

            return;

        }


        dados.forEach(item => {

            if(
                item.formaPagamento
                ===
                forma.nome
            ){

                item.formaPagamento =
                    novaForma.nome;

            }

        });


        salvarDados(dados);

    }


    if(opcao === "2"){

        dados.forEach(item => {

            if(
                item.formaPagamento
                ===
                forma.nome
            ){

                item.formaPagamento =
                    "";

            }

        });


        salvarDados(dados);

    }


    if(
        opcao !== "1"
        &&
        opcao !== "2"
    ){

        alert(
            "Opção inválida."
        );

        return;

    }


    formas.splice(index, 1);

    salvarFormasPagamento(formas);

    renderizarFormasPagamento();

    atualizarFormasPagamentoLancamento();

    atualizarInicio();

    renderizar();

}


const mostrarTelaComFormasPagamento =
    mostrarTela;


mostrarTela = function(
    id,
    botao = null
){

    mostrarTelaComFormasPagamento(
        id,
        botao
    );

    if(
        id === "telaFormasPagamento"
    ){

        renderizarFormasPagamento();

    }

};


atualizarFormasPagamentoLancamento();

/* ==========================================================
   FINALIZAÇÃO - FORMAS DE PAGAMENTO
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    atualizarFormasPagamentoLancamento();

});



function fecharInfoResumo(){

    const popup = document.getElementById("popupInfoResumo");

    popup.style.display = "none";

}

function mostrarInfoResumo(tipo){

    const popup = document.getElementById("popupInfoResumo");
    const titulo = document.getElementById("tituloInfoResumo");
    const texto = document.getElementById("textoInfoResumo");

    if(tipo === "categoria"){

        titulo.innerHTML = "🏷️ Gastos por categoria";

        texto.innerHTML =
        "Mostra como os gastos deste mês estão distribuídos entre as categorias.<br><br>" +
        "A porcentagem representa quanto cada categoria corresponde do total de gastos do mês.";

    }

    if(tipo === "pagamento"){

        titulo.innerHTML = "💳 Gastos por forma de pagamento";

        texto.innerHTML =
        "Mostra quanto foi gasto usando cada forma de pagamento neste mês.<br><br>" +
        "A porcentagem representa quanto cada forma de pagamento corresponde do total de gastos.";

    }

    popup.style.display = "flex";
}


function fecharInfoResumo(){

    const popup = document.getElementById("popupInfoResumo");

    popup.style.display = "none";

}