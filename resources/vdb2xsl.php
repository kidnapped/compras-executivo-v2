<?php
require 'vendor/autoload.php';
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;

function executarQueryJava($query) {
    $querySafe = escapeshellarg($query);
    $javaDir = "/home/ec2-user/java";
    $class = "DaaSQuery";
    $jar = "jboss-dv-6.3.0-teiid-jdbc.jar";
    $cmd = "cd $javaDir && java -cp .:$jar $class $querySafe 2>/dev/null";
    exec($cmd, $output, $ret);
    return ($ret === 0 && !empty($output)) ? $output : [];
}

echo "🔍 Iniciando exportação...\n";
$spreadsheet = new Spreadsheet();
$spreadsheet->removeSheetByIndex(0);

// Limite de exemplos por tabela
$limiteAmostras = 100;

// Buscar tabelas de exemplo
$query = "
    SELECT t.schemaName, t.name 
    FROM SYS.Tables t 
    WHERE t.schemaName NOT LIKE 'SYS%' 
    ORDER BY t.schemaName, t.name 
    LIMIT 5
";
$tabelas = executarQueryJava($query);
unset($tabelas[0]); // remove cabeçalho

foreach ($tabelas as $linha) {
    [$schema, $tabela] = array_map('trim', explode(" | ", $linha));
    echo "📄 Processando $schema.$tabela\n";

    $sheetName = substr($tabela, 0, 31); // nome amigável
    $sheet = $spreadsheet->createSheet();
    $sheet->setTitle($sheetName);

    // Título descritivo (linha 1)
    $titulo = "Tabela: $tabela | Schema: $schema";
    $sheet->mergeCells('A1:H1');
    $sheet->setCellValue('A1', $titulo);
    $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(12);
    $sheet->getStyle('A1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFEFEFEF');

    // Buscar campos
    $queryCampos = "
        SELECT c.name, c.dataType 
        FROM SYS.Columns c 
        WHERE c.schemaName = '$schema' AND c.tableName = '$tabela' 
        ORDER BY c.name
    ";
    $campos = executarQueryJava($queryCampos);
    unset($campos[0]);
    $colunas = $tipos = [];
    foreach ($campos as $c) {
        [$nome, $tipo] = array_map('trim', explode(" | ", $c));
        $colunas[] = $nome;
        $tipos[] = $tipo;
    }

    // Cabeçalho (linha 2)
    $sheet->fromArray($colunas, null, 'A2');
    $sheet->getStyle("A2:" . chr(64 + count($colunas)) . "2")->getFont()->setBold(true);

    // Tipos (linha 3)
    $sheet->fromArray($tipos, null, 'A3');
    $sheet->getStyle("A3:" . chr(64 + count($colunas)) . "3")->getFont()->setItalic(true)->getColor()->setRGB('555555');

    // Amostras de dados (linha 4+)
    $queryAmostra = "SELECT * FROM \"$schema\".\"$tabela\" LIMIT $limiteAmostras";
    $dados = executarQueryJava($queryAmostra);
    unset($dados[0]); // cabeçalho original
    $linha = 4;
    foreach ($dados as $d) {
        $valores = array_map('trim', explode(" | ", $d));
        $sheet->fromArray($valores, null, "A$linha");
        $linha++;
    }

    // Auto-ajuste de colunas (até 20 colunas máx)
    for ($col = 0; $col < min(20, count($colunas)); $col++) {
        $sheet->getColumnDimensionByColumn($col + 1)->setAutoSize(true);
    }
}

$filename = "estrutura_daas_amigavel_" . date("Ymd_His") . ".xlsx";
$writer = new Xlsx($spreadsheet);
$writer->save($filename);
echo "✅ Excel gerado: $filename\n";
