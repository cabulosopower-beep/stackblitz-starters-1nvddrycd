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


const totalDespesasMes =
    document.getElementById("totalDespesasMes");

const totalPendenteMes =
    document.getElementById("totalPendenteMes");

    const totalReceitasMes =
    document.getElementById("totalReceitasMes");

const saldoMes =
    document.getElementById("saldoMes");

    const campoValor = document.getElementById("valor");

    campoValor.addEventListener("input", function () {
      let valor = this.value.replace(/[^0-9,]/g, "");
    
      const partes = valor.split(",");
      if (partes.length > 2) {
        valor = partes[0] + "," + partes.slice(1).join("");
      }
    
      this.value = valor;
    });

/* ==========================================================
   EVENTOS
========================================================== */


filtroMes.addEventListener(
    "change",
    renderizar
);


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
    inputValor.value = moeda(registro.valor);
    inputDataLancamento.value = registro.data.split("T")[0];
    selectTipo.value = registro.tipo;
    selectCategoria.value = registro.categoria;
    inputObservacao.value = registro.observacao;

    idEdicao = id;

    document.querySelector(".btnSalvar").innerText =
        "Atualizar Registro";

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


form.addEventListener(
    "submit",
    (evento) => {

        evento.preventDefault();


        const descricao =
            inputDescricao.value.trim();


            const valor =
            Number(
                inputValor.value
                    .replace(",", ".")
            );
        
            const confirmar = confirm(
                `Deseja salvar este lançamento?\n\n` +
                `Descrição: ${descricao}\n` +
                `Valor: R$ ${moeda(valor)}\n` +
                `Categoria: ${selectCategoria.value}`
            );
            
            
            if(!confirmar){
            
                return;
            
            }

        const tipo =
            selectTipo.value;


        const categoria =
            selectCategoria.value;


        const observacao =
            inputObservacao.value.trim();


        const dataEscolhida =
            inputDataLancamento.value;
        
        
        const agora =
            dataEscolhida
                ?
                new Date(dataEscolhida + "T12:00:00")
                :
                new Date();


        const dados =
            carregarDados();


        const grupoID =
            String(
                Date.now()
                +
                Math.random()
            );



        if(parcelado.value === "sim"){

            criarParcelas({
                dados,
                grupoID,
                descricao,
                valor,
                tipo,
                categoria,
                observacao,
                agora
            });

        }

        
        else{

            if(idEdicao){
        
                const registro = encontrarRegistro(dados, idEdicao);
        
                registro.descricao = descricao;
                registro.valor = valor;
                registro.tipo = tipo;
                registro.categoria = categoria;
                registro.observacao = observacao;
                registro.data = agora.toISOString();
        
                idEdicao = null;
        
                document.querySelector(".btnSalvar").innerText =
                    "Salvar Registro";
        
            }else{
        
                dados.push({
        
                    id: String(gerarID()),
        
                    grupo: grupoID,
        
                    descricao,
        
                    valor,
        
                    tipo,
        
                    categoria,
        
                    observacao,
        
                    parcela: "",
        
                    status: "pendente",
        
                    data: agora.toISOString()
        
                });
        
            }
        
        }
        const msg = document.getElementById("mensagem");

                msg.innerText = "Registro salvo com sucesso!";
                msg.style.color = "green";

        setTimeout(()=>{msg.innerText="";},3000);


        salvarDados(dados);


        limparFormulario();


        renderizar();


    }
);



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
    observacao,
    agora
}){


    const quantidade =
    Number(inputParcelas.value);



    const valorParcela =
        Number(
            (valor / quantidade)
            .toFixed(2)
        );



        for(
            let i = 0;
            i < quantidade;
            i++
        ){


        const dataParcela =
            new Date(agora);



        dataParcela.setMonth(
            dataParcela.getMonth()
            +
            i
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


    areaParcelas.style.display =
        "none";


    inputParcelas.value =
        2;

    inputDataLancamento.value =
        new Date()
            .toISOString()
            .split("T")[0];

    idEdicao = null;

    document.querySelector(".btnSalvar").innerText =
                "Salvar Registro";
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
                    Categoria:
                    ${item.categoria}
                </div>


                <div class="info">

                    Obs:

                    <span
                        contenteditable="true"
                        onblur="salvarObservacao('${item.id}', this.innerText)"
                    >
                        ${item.observacao || ""}
                    </span>

                </div>


                ${
                    item.parcela

                    ?

                    `
                    <div class="info">
                        Parcela:
                        ${item.parcela}
                    </div>
                    `

                    :

                    ""
                }


                <div class="info">
                    ${dataHora}
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
                ? "btnPago"
                : "btnPagar"
            }"
        >
            ${
                item.status === "pago"
                ? "Pago"
                : "Pagar"
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

    const hoje =
        new Date();



    filtroMes.value =

        hoje.getFullYear()

        +

        "-"

        +

        String(
            hoje.getMonth() + 1
        )
        .padStart(2, "0");



    renderizar();


}





/* ==========================================================
   EXECUÇÃO INICIAL
========================================================== */


iniciarApp();

/* ==========================================================
   TEMA ESCURO
========================================================== */

const botaoTema = document.getElementById("toggleTheme");


if(botaoTema){

    botaoTema.addEventListener("click", () => {

        document.body.classList.toggle("dark");


        if(document.body.classList.contains("dark")){

            localStorage.setItem(
                "tema",
                "dark"
            );

            botaoTema.innerText = "☀️";

        }

        else{

            localStorage.setItem(
                "tema",
                "light"
            );

            botaoTema.innerText = "🌙";

        }

    });

}



/* CARREGAR TEMA SALVO */

const temaSalvo =
    localStorage.getItem("tema");


if(temaSalvo === "dark"){

    document.body.classList.add("dark");

    if(botaoTema){

        botaoTema.innerText = "☀️";

    }

}