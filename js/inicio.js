/* ==========================================================
   TELA INICIAL (RESUMO, COMPARATIVO, GRÁFICOS E BACKUP)
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
        const categoriasCadastradas = carregarCategorias();

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