$ErrorActionPreference = 'Stop'

$OutputDir = Join-Path $PSScriptRoot '..\output\sat_parser\2025-aug-v1'

function Set-QuestionBankFields($row) {
    $row.test_period = ''
    $row.test_version = ''
    $row.has_image = 'False'
    $row.image_url = ''
}

function Set-Passage($row, $text) {
    $row.passage = $text
}

$readingPath = Join-Path $OutputDir 'ebrw_mcq.csv'
$reading = @(Import-Csv -LiteralPath $readingPath | Sort-Object { [int]$_.page })
foreach ($row in $reading) {
    Set-QuestionBankFields $row
    if ([int]$row.page -le 27) {
        $row.module = 'Reading and Writing Module 1'
    } else {
        $row.module = 'Reading and Writing Module 2'
    }
    $row.question_number = (([int]$row.page - 1) % 27) + 1
    switch ($row.page) {
        '10' {
            Set-Passage $row "Fish abundance in three Taiwanese tide pools: barred flagtail—station 1: 249, station 2: 64, station 3: 16; streaky rockskipper—125, 139, 610; blackspotted rockskipper—83, 74, 31; Cocos frillgoby—50, 64, 90.`n`n$($row.passage)"
        }
        '11' {
            Set-Passage $row "Numbers of non-native tree species and associated insect and fungal threats: Austria—trees 13, fungi 51, insects 50; Belgium—trees 4, fungi 13, insects 11; Bulgaria—trees 9, fungi 14, insects 16.`n`n$($row.passage)"
        }
        '37' {
            Set-Passage $row "Video game units sold: ColecoVision (Coleco, console)—2,000,000; Intellivision (Mattel, console)—3,000,000; MSX (ASCII Corporation, computer)—4,000,000; Game & Watch (Nintendo, handheld)—18,600,000.`n`n$($row.passage)"
        }
        '39' {
            Set-Passage $row "Observed traits in a population of broadleaf arrowhead by flowering date: day 5—open flowers 25, male reproductive success 0.29, proportion male 0.45; day 10—65, 0.29, 0.50; day 15—110, 0.29, 0.48; day 20—45, 0.29, 0.13.`n`n$($row.passage)"
        }
    }
}
$reading | ForEach-Object -Begin { $id = 1 } -Process { $_.id = $id; $id++; $_ } | Export-Csv -LiteralPath $readingPath -NoTypeInformation -Encoding utf8

$mathMcqPath = Join-Path $OutputDir 'math_mcq.csv'
$mathMcq = @(Import-Csv -LiteralPath $mathMcqPath)
# Page 77 and page 92 each contain a duplicate extraction. Keep the populated/correct row.
$mathMcq = @(
    $mathMcq |
        Group-Object page |
        ForEach-Object {
            if ($_.Name -in @('77', '92')) { $_.Group | Select-Object -First 1 }
            else { $_.Group }
        }
)

$mathOpenPath = Join-Path $OutputDir 'math_open.csv'
$mathOpen = @(Import-Csv -LiteralPath $mathOpenPath)
# The first page-72 row is a spurious duplicate with an impossible answer; retain the actual cylinder question.
$mathOpen = @($mathOpen | Where-Object { -not ($_.page -eq '72' -and $_.question -eq 'What is the value of $n - k$?') })

$m1Numbers = @{ 55 = 1; 56 = 2; 57 = 3; 58 = 4; 59 = 5; 60 = 6; 61 = 7; 62 = 8; 63 = 9; 64 = 10; 65 = 11; 66 = 12; 67 = 13; 68 = 14; 69 = 15; 70 = 16; 71 = 17; 72 = 18; 73 = 19; 74 = 20; 75 = 21; 76 = 22 }
$m2Numbers = @{ 77 = 1; 78 = 2; 79 = 3; 80 = 4; 81 = 5; 82 = 6; 83 = 7; 84 = 8; 85 = 9; 86 = 10; 87 = 11; 88 = 12; 89 = 13; 90 = 14; 91 = 15; 92 = 16; 93 = 17; 94 = 18; 95 = 19; 96 = 20; 97 = 21 }

foreach ($row in @($mathMcq) + @($mathOpen)) {
    Set-QuestionBankFields $row
    $page = [int]$row.page
    if ($page -le 76) {
        $row.module = 'Math Module 1'
        $row.question_number = $m1Numbers[$page]
    } else {
        $row.module = 'Math Module 2'
        $row.question_number = $m2Numbers[$page]
    }
}

foreach ($row in $mathMcq) {
    switch ($row.page) {
        '56' { Set-Passage $row 'Triangle $ABC$ has side $AB=48$. The choices state: $AC=24$; $BC=48$; $\angle A=70^\circ$; or the angle sum is $180^\circ$.' }
        '61' { Set-Passage $row 'For the linear function $g$, the table gives: $g(1)=24$, $g(2)=21$, $g(3)=18$, and $g(4)=15$.' }
        '62' { Set-Passage $row 'The area function is $h(x)=\frac{1}{2}(x)(89)$, where $x$ is the base of a triangle and the height is fixed.' }
        '66' { Set-Passage $row 'The system is $y-x=47$ and $y=x^2-45x$.' }
        '71' { Set-Passage $row 'A scatterplot of $d$ against $t$ has a line of best fit with slope about $2.02$ and a point near $(230,416)$.' }
        '76' { Set-Passage $row 'Parallel lines $q$ and $r$ are intersected by transversal $s$. One marked angle is $51^\circ$; the marked angle $y$ is its same-side interior supplement, so $y=129^\circ$.' }
        '78' { Set-Passage $row 'Amounts of salt $x$ (grams) and water $y$ (liters) in three seawater samples: $(217,7)$, $(248,8)$, and $(279,9)$.' }
        '85' { Set-Passage $row 'Survey results: group 1—41% with margin of error 13%; group 2—45%, 11%; group 3—45%, 8%; group 4—47%, 15%.' }
        '93' { Set-Passage $row 'Parallel lines $q$ and $r$ are intersected by transversal $s$. One marked angle is $57^\circ$; the marked angle $y$ is its same-side interior supplement, so $y=123^\circ$.' }
    }
}

foreach ($row in $mathOpen) {
    switch ($row.page) {
        '72' { Set-Passage $row 'Cylinder A has volume $32\pi$, radius $2$, and surface area $k\pi$. Similar cylinder B has volume $864\pi$ and surface area $n\pi$.' }
        '74' { Set-Passage $row 'The table gives $(x,y)=(16,-7),(19,11),(22,-7)$, where $y=f(x)+6$.'; $row.correct_answer = '-717' }
        '84' { Set-Passage $row 'In quadrilateral $KLMN$, $KL=LM=3$ and $KN=MN=27$. Its diagonals intersect at $G$, with $GK=GM=1$.' }
    }
}

$mathMcq = @($mathMcq | Sort-Object { [int]$_.page })
$mathOpen = @($mathOpen | Sort-Object { [int]$_.page })
$mathMcq | ForEach-Object -Begin { $id = 1 } -Process { $_.id = $id; $id++; $_ } | Export-Csv -LiteralPath $mathMcqPath -NoTypeInformation -Encoding utf8
$mathOpen | ForEach-Object -Begin { $id = 1 } -Process { $_.id = $id; $id++; $_ } | Export-Csv -LiteralPath $mathOpenPath -NoTypeInformation -Encoding utf8

Write-Output 'Cleaned August 2025 V1 for Question Bank (97 unique questions).'
