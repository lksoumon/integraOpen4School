// ==UserScript==
// @name         Importação open4School
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Faz a importação de dados entre sigeduca e Open
// @author       Lucas Monteiro
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @match        http://sigeduca.seduc.mt.gov.br/ged/hwmgrhturma.aspx?*
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://github.com/lksoumon/integraOpen4School/raw/refs/heads/main/Importa_turmas_open4School.user.js
// @downloadURL   https://github.com/lksoumon/integraOpen4School/raw/refs/heads/main/Importa_turmas_open4School.user.js
// ==/UserScript==

function isFutureDate(dateInput) {
    const [day, month, year] = dateInput.split('/').map(Number);
    const inputDate = new Date(year + 2000, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate > today;
}

function removirgula(str) {
    return str.replace(/,/g, '');
}

let turmaNome;
// Estilos CSS
    var styles = `
        #floatingMenuButton {
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: #3498db;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
        }
        #floatingMenuContainer {
            position: fixed;
            top: 40px;
            right: 10px;
            background-color: #ecf0f1;
            border: 1px solid #3498db;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            padding: 10px;
        }
        .menu-item {
            padding: 5px 0;
            color: #3498db;
            cursor: pointer;
        }
        .menu-item:hover {
            background-color: #3498db;
            color: white;
            cursor: pointer;
        }
    `;

    var styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

//DIV principal (corpo)
var divCredit = document.createElement('div');
document.getElementsByTagName('body')[0].appendChild(divCredit);

//Iframe
var ifrIframe1 = document.createElement("iframe");
ifrIframe1.setAttribute("id","iframe1");
ifrIframe1.setAttribute("src","about:blank");
ifrIframe1.setAttribute("style","height: 1000px; width: 355px; display:none");
divCredit.appendChild(ifrIframe1);


let carregamento = document.createElement("div");
      carregamento.id = "acomp";
      carregamento.style.textAlign = "center";
      carregamento.className = "menu";
carregamento.setAttribute('style', 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px; display: none; z-index: 9999; background-color: lightgrey;');
      //carregamento.innerHTML = "<div id='acomp'></div><br>";
document.getElementsByTagName('body')[0].appendChild(carregamento);

(function() {
    'use strict';

    // Cria o botão do menu
    var menuButton = document.createElement('div');
    menuButton.id = 'floatingMenuButton';
    menuButton.innerHTML = 'Importação';
    document.body.appendChild(menuButton);

    // Cria o container do menu
    var menuContainer = document.createElement('div');
    menuContainer.id = 'floatingMenuContainer';
    menuContainer.style.display = 'none'; // Inicia escondido


    var subButton;
    subButton = document.createElement('div');
    subButton.className = "menu-item";
    subButton.id = "btnCarregar";
    subButton.textContent = 'Carregar dados das turmas';
    subButton.addEventListener('click', function() {
            //alert('foi');
        if(document.getElementById("GridfreestyleContainerRow_0001")){
            carregaDados();
            document.getElementById("exportaTurmas").style.display = 'block';document.getElementById("btnCarregar").style.display = 'none';

            var codEscola = document.getElementById("MPW0010TLOTACAO").innerText;
            var index = codEscola.indexOf(' - ');

            codEscola = codEscola.substring(0, index).trim();

            geraBotoes(output,codEscola);
            //console.log(codEscola);
        }else{
        alert('Pressione o botão consultar para carregar as turmas');
        }

     });

     menuContainer.appendChild(subButton);


    subButton = document.createElement('div');
    subButton.className = "menu-item";
    subButton.id = "exportaTurmas";
    subButton.style.display = 'none';
    subButton.style.padding = 3;
    subButton.textContent = 'Tabelar dados das turmas';
    subButton.addEventListener('click', function() {
            //alert('esse extrai os dados das turmas');
        downloadCSV(output,'dadosTurmas.csv');

     });

     menuContainer.appendChild(subButton);

    document.body.appendChild(menuContainer);

     // Adiciona evento de clique no botão do menu
    menuButton.addEventListener('click', function() {
        if (menuContainer.style.display == 'none') {
            //alert('oi');
            menuContainer.style.display = 'block';
        } else {
            menuContainer.style.display = 'none';
        }
    });

})();

var output;
function carregaDados(){
    var n = 1;var temp = []; output = [];
    var tabelas = document.getElementsByTagName('table');
    var cabec = ['Matriz'];
    for (let k = 0; k < document.getElementById('GriddetalhesContainer_0001Tbl').getElementsByTagName('tr')[0].getElementsByTagName('span').length; k++) {
        cabec.push(document.getElementById('GriddetalhesContainer_0001Tbl').getElementsByTagName('tr')[0].getElementsByTagName('span')[k].innerText.trim());
    }
    output.push(cabec);

    for (let i = 0; i < tabelas.length; i++) {

        if(tabelas[i].id.includes('GriddetalhesContainer_')){
            let matriz = document.getElementById('span_vGERMATDSC_'+("0000" + n).slice(-4)).innerText.trim();
            var m = 1;
            for (let j = 0; j < tabelas[i].getElementsByTagName('tr').length; j++) {

                if(j!=0){
                    //console.log(m,n,document.getElementById('span_vGERTURDTAFIM_'+("0000" + m).slice(-4)+("0000" + n).slice(-4)).innerText.trim());//span_vSITUACAOTURMA_00010009
                    if(!isFutureDate(document.getElementById('span_vGERTURDTAFIM_'+("0000" + m).slice(-4)+("0000" + n).slice(-4)).innerText.trim())){continue;}

                    m++;
                    temp.push(matriz);
                    for (let k = 0; k < tabelas[i].getElementsByTagName('tr')[j].getElementsByTagName('span').length; k++) {
                        temp.push(tabelas[i].getElementsByTagName('tr')[j].getElementsByTagName('span')[k].innerText.trim());

                    }
                    output.push(temp);
                    temp=[];
                }
            }
            n++;
        }
    }
    //console.log(output);
    //return output;

}

function geraBotoes(array,codEscola){
   // alert ('foi');
    var subButton; var menuContainer = document.getElementById("floatingMenuContainer");


    for (let i = 1; i<array.length;i++){
        subButton = document.createElement('div');
        subButton.className = "menu-item";
        subButton.id = "export";
        subButton.style.display = 'block';
        subButton.style.padding = 3;
        subButton.textContent = 'Exportar alunos do '+array[i][6]+' '+array[i][10]+' - matriz: '+array[i][20];

        subButton.addEventListener('click', function() {
            //alert('foi');
            turmaNome = array[i][6]+' - '+array[i][10]+' - matriz: '+array[i][0];
            puxaDadosTurma('http://sigeduca.seduc.mt.gov.br/ged/hwmgedagfechaaluno.aspx?0,'+array[i][11]+','+codEscola+','+array[i][2]+','+array[i][9]+',N,1,01012021,12122021,1,0,0,'+array[i][20]+','+array[i][10]+',0,1,0,1,N,0,0');

        });

        menuContainer.appendChild(subButton);


}


}

function downloadCSV(data, filename) {
  // Converter array de arrays para formato CSV
  const csvContent = "data:text/csv;charset=utf-8," +
                     data.map(row => row.join(",")).join("\n");

  // Criar um elemento de link para download
  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = filename || "data.csv";

  // Simular um clique no link para iniciar o download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function puxaDadosTurma(link){
    ifrIframe1.src = link;
    ifrIframe1.addEventListener("load", listaCodigos);
}
let arrayCod;let outputTurma;let n = 0;
function listaCodigos(){
    var cod;outputTurma=[];arrayCod=[];n = 0;
    ifrIframe1.removeEventListener("load", listaCodigos, false);
    ifrIframe1.addEventListener("load", coletaDados);
    var qtdeCods = parent.frames[0].document.getElementById("GridalunosContainerTbl").getElementsByTagName('tr').length-1;
    console.log(qtdeCods);
    for (var i = 1; i <= qtdeCods; i++){
        let nserv = ("0000" + i).slice(-4);
        cod = parent.frames[0].document.getElementById("span_vGRID_GEDALUCOD2_"+nserv).innerText.trim();
        arrayCod.push(cod);
    }
    //return arrayCod;
    ifrIframe1.src = "http://sigeduca.seduc.mt.gov.br/ged/hwtmgedaluno.aspx?"+arrayCod[0]+",,HWMConAluno,DSP,1,0";


    //console.log(arrayCod);
}

function coletaDados() {
    var temp;
    var cabecalho = ["turma","codigo","Nº INEP","Nome do aluno","CPF do Aluno","RG do aluno","Órgão Expedidor","UF Exp.","Data Exp.","Sexo do Aluno","Data de Nascimento","Naturalidade","UF","Filiação 1","filiação 2",
                     "nome do responsável 1","CPF do responsável 1","DDD Residencial","Tel Res Resp 1","DDD Celular","Tel Celular Resp 1","DDD Comercial","Tel Comercial Resp 1","DDD Contato","Tel Contato Resp 1","E-mail Resp 1",
                      "Nome do responsável 2","CPF do responsável 2","DDD Residencial","Tel Res Resp 2","DDD Celular","Tel Celular Resp 2","DDD Comercial","Tel Comercial Resp 2","DDD Contato","Tel Contato Resp 2","E-mail Resp 2",
                      "DDD Residencial","Tel Residencial",'DDD Celular','Tel Celular','DDD Comercial','Tel Comercial','DDD Contato','Tel Contato',
                      'Endereço Rua','Número','Complemento','Bairro','Cidade','UF','CEP','UC (Distribuidora)','Nº UC','Localização','Nome Social'
                     ];

    carregamento.style.display = "block";

    if(n < arrayCod.length){
        criarLoadingMenu(n,arrayCod.length);
        //Dados gerais do Aluno
        console.log(arrayCod[n],n);
        temp = [
        turmaNome,
        arrayCod[n],// cabecalho = "Cod Aluno;", //Cod Aluno
        parent.frames[0].document.getElementById('span_CTLGEDALUIDINEP').innerHTML,// cabecalho = cabecalho+"Nº INEP;"; //Matrícula INEP
        parent.frames[0].document.getElementById('span_CTLGERPESNOM').innerHTML,// cabecalho = cabecalho+"Aluno;";
        parent.frames[0].document.getElementById('span_CTLGERPESCPF').innerHTML.replace(/^([\d]{3})([\d]{3})([\d]{3})([\d]{2})$/, "$1.$2.$3-$4") , //cabecalho = cabecalho+"CPF do Aluno;";
        parent.frames[0].document.getElementById('span_CTLGERPESRG').innerHTML ,// cabecalho = cabecalho+"RG do aluno;";
        removirgula(parent.frames[0].document.getElementById('span_CTLGERORGEMICOD').innerHTML), //cabecalho = cabecalho+"Órgão Expedidor;";
        parent.frames[0].document.getElementById('span_CTLGERPESUFEXP').innerHTML, //cabecalho = cabecalho+UF Expedidor;";
        parent.frames[0].document.getElementById('span_CTLGERPESDTAEXP').innerHTML, //cabecalho = cabecalho+"Data Expedição;";
        parent.frames[0].document.getElementById('span_CTLGERPESSEXO').innerHTML , //cabecalho = cabecalho+"Sexo do Aluno;";
        parent.frames[0].document.getElementById('span_CTLGERPESDTANASC').innerHTML ,// cabecalho = cabecalho+"Data de Nascimento;";
        parent.frames[0].document.getElementById('span_CTLGERPESNATDSC').innerHTML,// cabecalho = cabecalho+"Naturalidade;";
        parent.frames[0].document.getElementById('span_CTLGERPESNATUF').innerHTML , //cabecalho = cabecalho+"UF;";
        parent.frames[0].document.getElementById('span_CTLGERPESNOMMAE').innerHTML, //cabecalho = cabecalho+"Filiação 1;";
        parent.frames[0].document.getElementById('span_CTLGERPESNOMPAI').innerHTML,// cabecalho = cabecalho+"filiação 2;";

        //Contatos responsável 1
        parent.frames[0].document.getElementById('span_CTLGERPESNOMRESP').innerHTML,// cabecalho = cabecalho+"Nome do responsável 1;";
        parent.frames[0].document.getElementById('span_CTLGERPESRESPCPF').innerHTML.replace(/^([\d]{3})([\d]{3})([\d]{3})([\d]{2})$/, "$1.$2.$3-$4"), //cabecalho = cabecalho+"CPF do responsável 1;";
        parent.frames[0].document.getElementById('span_CTLGERPESTELRESDDDRESP').innerHTML, //DDD Residencial
        parent.frames[0].document.getElementById('span_CTLGERPESTELRESRESP').innerHTML, //cabecalho = cabecalho+"Tel Res Resp 1;";
        parent.frames[0].document.getElementById('span_CTLGERPESTELCELDDDRESP').innerHTML, //DDD Celular
        parent.frames[0].document.getElementById('span_CTLGERPESTELCELRESP').innerHTML,// cabecalho = cabecalho+"Tel Celular Resp 1;";
        parent.frames[0].document.getElementById('span_CTLGERPESTELCOMDDDRESP').innerHTML, //DDD Comercial
        parent.frames[0].document.getElementById('span_CTLGERPESTELCOMRESP').innerHTML, //cabecalho = cabecalho+"Tel Comercial Resp 1;";
        parent.frames[0].document.getElementById('span_CTLGERPESTELCONDDDRESP').innerHTML, //DDD Contato
        parent.frames[0].document.getElementById('span_CTLGERPESTELCONRESP').innerHTML,// cabecalho = cabecalho+"Tel Contato Resp 1;";
        parent.frames[0].document.getElementById('span_CTLGERPESEMAILRESP').innerHTML,// cabecalho = cabecalho+"E-mail Resp 1;";

        //Contatos responsável 2
        parent.frames[0].document.getElementById('span_CTLGERPESNOMRESP2').innerHTML, //cabecalho = cabecalho+"Nome do responsável 2;";
        parent.frames[0].document.getElementById('span_CTLGERPESRESPCPF2').innerHTML.replace(/^([\d]{3})([\d]{3})([\d]{3})([\d]{2})$/, "$1.$2.$3-$4"),// cabecalho = cabecalho+"CPF do responsável 2;";
        parent.frames[0].document.getElementById('CTLGERPESTELRESDDDRESP2').innerHTML, //DDD Residencial
        parent.frames[0].document.getElementById('CTLGERPESTELRESRESP2').innerHTML, //cabecalho = cabecalho+"Tel Res Resp 2;";
        parent.frames[0].document.getElementById('CTLGERPESTELCELDDDRESP2').innerHTML, //DDD Celular
        parent.frames[0].document.getElementById('CTLGERPESTELCELRESP2').innerHTML,// cabecalho = cabecalho+"Tel Celular Resp 2;";
        parent.frames[0].document.getElementById('CTLGERPESTELCOMDDDRESP2').innerHTML, //DDD Comercial
        parent.frames[0].document.getElementById('CTLGERPESTELCOMRESP2').innerHTML, //cabecalho = cabecalho+"Tel Comercial Resp 2;";
        parent.frames[0].document.getElementById('CTLGERPESTELCONDDDRESP2').innerHTML, //DDD Contato
        parent.frames[0].document.getElementById('CTLGERPESTELCONRESP2').innerHTML,// cabecalho = cabecalho+"Tel Contato Resp 2;";
        parent.frames[0].document.getElementById('CTLGERPESEMAILRESP2').innerHTML,// cabecalho = cabecalho+"E-mail Resp 2;";

        //Contato da seção final da página (ENDEREÇO)
        parent.frames[0].document.getElementById('span_CTLGERPESTELRESDDD').innerHTML, //DDD Residencial 2
        parent.frames[0].document.getElementById('span_CTLGERPESTELRES').innerHTML,// cabecalho = cabecalho+"Tel Residencial;";
        parent.frames[0].document.getElementById('span_CTLGERPESTELCELDDD').innerHTML, //DDD Celular 2
        parent.frames[0].document.getElementById('span_CTLGERPESTELCEL').innerHTML,// cabecalho = cabecalho+"Tel Celular;";
        parent.frames[0].document.getElementById('span_CTLGERPESTELCOMDDD').innerHTML, //DDD Comercial 2
        parent.frames[0].document.getElementById('span_CTLGERPESTELCOM').innerHTML,// cabecalho = cabecalho+"Tel Comercial;";
        parent.frames[0].document.getElementById('span_CTLGERPESTELCONDDD').innerHTML, //DDD Contato 2
        parent.frames[0].document.getElementById('span_CTLGERPESTELCON').innerHTML,// cabecalho = cabecalho+"Tel Contato;";

        //Endereço
        parent.frames[0].document.getElementById('span_CTLGERPESEND').innerHTML.replace(/,/g, ' '), //cabecalho = cabecalho+"Endereço Rua;";
        parent.frames[0].document.getElementById('span_CTLGERPESNMRLOG').innerHTML,// cabecalho = cabecalho+"Número;";
        parent.frames[0].document.getElementById('span_CTLGERPESCMPLOG').innerHTML.replace(/,/g, ' '),// cabecalho = cabecalho+"Complemento;";
        parent.frames[0].document.getElementById('span_CTLGERPESBAIRRO').innerHTML.replace(/,/g, ' '), //cabecalho = cabecalho+"Bairro;";
        parent.frames[0].document.getElementById('span_CTLGERPESENDCIDDSC').innerHTML.replace(/,/g, ' '),// cabecalho = cabecalho+"Cidade;";
        parent.frames[0].document.getElementById('span_CTLGERPESENDUF').innerHTML, //cabecalho = cabecalho+"UF;";
        parent.frames[0].document.getElementById('span_CTLGERPESCEP').innerHTML,// cabecalho = cabecalho+"CEP;";
        parent.frames[0].document.getElementById('span_CTLGERPESDISTCOD').innerHTML, //cabecalho = cabecalho+"UC (Distribuidora);";
        parent.frames[0].document.getElementById('span_CTLGERPESUC').innerHTML,// cabecalho = cabecalho+"Nº UC;";
        parent.frames[0].document.getElementById('span_CTLGERPESLOCRES').innerHTML,// cabecalho = cabecalho+"Localização;";
        parent.frames[0].document.getElementById('span_CTLGERPESNOMSOC').innerHTML.replace(/['"]/g, "`"),// cabecalho = cabecalho+"Nome Social;";
        ];

        //txtareaDados.value = cabecalho+"\n"+a;
        outputTurma.push(temp);
        n++;
        if(n < arrayCod.length){
            ifrIframe1.src = "http://sigeduca.seduc.mt.gov.br/ged/hwtmgedaluno.aspx?"+arrayCod[n]+",,HWMConAluno,DSP,1,0";
        }
    }
    if(n >= arrayCod.length){
        outputTurma.unshift(cabecalho);
        //console.log(outputTurma);
         carregamento.style.display = "none";
        ifrIframe1.removeEventListener("load", coletaDados, false);
        downloadCSV(outputTurma,'dados_Alunos_Por_Turma.csv');
        //txtareaDados.select();
        //document.execCommand("copy");
        alert('finalizado');
    }
}

function criarLoadingMenu(valorAtual, valorMaximo) {
    var loadingDiv = document.getElementById("acomp");
    var loadingContent = document.getElementById("acomp");

    if(valorAtual == valorMaximo){ loadingDiv.style.display = "none";}else{
        // Criar a div do menu de loading
        loadingDiv = document.getElementById("acomp");
        //loadingDiv.id = "loadingMenu";
        loadingDiv.className = "loading-menu";

        // Calcular a porcentagem concluída
        var percentConcluido = (valorAtual / valorMaximo) * 100;
        percentConcluido = Math.min(100, Math.max(0, percentConcluido)); // Garantir que a porcentagem esteja entre 0 e 100

        // Criar o conteúdo do menu de loading
         loadingContent = document.getElementById("acomp");
        loadingContent.className = "loading-content";
        loadingContent.innerHTML = `
        <p>Carregando...</p>
        <progress value="${percentConcluido}" max="100"></progress>
        <p>${valorAtual} de ${valorMaximo}</p>
      `;

        loadingDiv.style.display = "block";
    }
}
