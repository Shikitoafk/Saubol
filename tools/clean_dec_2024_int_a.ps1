$ErrorActionPreference = 'Stop'

$OutputDir = Join-Path $PSScriptRoot '..\output\sat_parser\2024-dec-int-a'

function Reset-CommonFields($row) {
    $row.test_period = ''
    $row.test_version = ''
    $row.has_image = 'False'
    $row.image_url = ''
}

$readingPath = Join-Path $OutputDir 'ebrw_mcq.csv'
$reading = @(Import-Csv -LiteralPath $readingPath)
for ($i = 0; $i -lt $reading.Count; $i++) {
    $row = $reading[$i]
    Reset-CommonFields $row
    $row.id = [string]($i + 1)
    if ([int]$row.page -le 28) {
        $row.module = 'Reading and Writing Module 1'
    } else {
        $row.module = 'Reading and Writing Module 2'
    }

    switch ($row.page) {
        '11' {
            $row.passage = "Total Areas of Five Hawaiian Home Lands (square miles): Nanakuli, 3.61; Kawaihae, 15.99; Kamoku-Kapulena, 7.47; Kahikinui, 37.26; Waimea, 23.57.`n`nHawaiian home lands are areas of public land in the state of Hawaii that have been reserved for use by the Kanaka Maoli, or the Native Hawaiian people. The largest of the home lands, Homuula-Upper Piihonua, covers nearly 100 square miles on the island of Hawai'i. Most of the home lands are much smaller. For example, the total area of Kamoku-Kapulena is 7.47 square miles, and the total area of Nanakuli is ______."
            $row.correct_answer = 'B'
        }
        '43' {
            $row.passage = "Cougar population-density estimates (individuals per 100 square kilometers): Ross and Jalkotzy, radio-collar tracking, minimum 2.70, maximum 4.70, range 2.00; Davidson et al., scat-detecting dogs, minimum 2.31, maximum 5.50, range 3.19; Choate et al., helicopter surveying, minimum 5.59, maximum 10.24, range 4.65; Sollmann et al., infrared camera trapping and GPS, minimum 1.46, maximum 1.51, range 0.05.`n`nResearchers have used several different methods to determine the population density of cougars (Puma concolor). A student claims that the use of scat-detecting dogs produces the most precise results, with the smallest difference between minimum and maximum densities."
            $row.correct_answer = 'C'
        }
        '44' {
            $row.passage = "Correlations between model predictions and participant ratings were approximately as follows: for impressionist paintings, P4 0.27, P7 0.29, and P5 0.23; for color-field paintings, P4 0.17, P7 0.26, and P5 0.22.`n`nNeuroscientist Kiyohito Iigaya and colleagues developed a computational model to predict how much a person will enjoy a particular work of art on a scale from 1 (not at all) to 4 (very much). They then recruited participants to use the same scale to rate several sets of paintings in various styles and calculated the correlation between the ratings predicted by the model and those reported by the participants. Assuming participant P7 gave equal ratings to the impressionist and color-field paintings, the data suggest that the model predicted that ______"
            $row.correct_answer = 'A'
        }
    }
}
$reading | Export-Csv -LiteralPath $readingPath -NoTypeInformation -Encoding utf8

$mathMcqPath = Join-Path $OutputDir 'math_mcq.csv'
$mathMcq = @(Import-Csv -LiteralPath $mathMcqPath | Where-Object { $_.page -ne '62' })
for ($i = 0; $i -lt $mathMcq.Count; $i++) {
    $row = $mathMcq[$i]
    Reset-CommonFields $row
    $row.id = [string]($i + 1)
    if ([int]$row.page -le 87) {
        $row.module = 'Math Module 1'
    } else {
        $row.module = 'Math Module 2'
    }

    switch ($row.page) {
        '63' {
            $row.question_number = '1'
            $row.passage = 'The graphs of two linear equations intersect at the point $(-4, 2)$. The solution to the system is $(x, y)$.'
            $row.question = 'What is the value of $y$?'
            $row.correct_answer = 'C'
        }
        '66' {
            $row.passage = "The table gives the points $(0,22)$, $(1,23)$, and $(2,24)$. There is a linear relationship between $x$ and $y$."
        }
        '70' {
            $row.passage = 'A participant completed five tasks in 8, 6, 14, 11, and 11 minutes, respectively.'
        }
        '72' {
            $row.passage = 'A line of best fit on a scatterplot decreases from approximately $(0, 11)$ to approximately $(8, 4.5)$.'
        }
        '73' {
            $row.question_number = '11'
            $row.passage = 'Parallel lines $q$ and $r$ are cut by transversal $s$. A 77-degree angle at the upper intersection and angle $y$ at the lower intersection are alternate interior angles, so they are congruent.'
        }
        '88' {
            $row.passage = 'A right triangle has one acute angle measuring $24$ degrees. The other acute angle measures $a$ degrees.'
        }
        '99' {
            $row.passage = 'Triangle $JKL$ is right at $K$, its hypotenuse $JL$ has length 90, and $\tan(\angle L)=\frac{3}{4}$.'
        }
        '108' {
            $row.passage = 'The graph of the linear function $y=f(x)+11$ is decreasing and has a y-intercept of approximately 1. If $c$ and $d$ are positive constants, which equation could define $f$?'
        }
    }
}
$mathMcq | Export-Csv -LiteralPath $mathMcqPath -NoTypeInformation -Encoding utf8

$mathOpenPath = Join-Path $OutputDir 'math_open.csv'
$mathOpen = @(Import-Csv -LiteralPath $mathOpenPath | Where-Object { $_.page -notin @('77', '93') })
for ($i = 0; $i -lt $mathOpen.Count; $i++) {
    $row = $mathOpen[$i]
    Reset-CommonFields $row
    $row.id = [string]($i + 1)
    if ([int]$row.page -le 87) {
        $row.module = 'Math Module 1'
    } else {
        $row.module = 'Math Module 2'
    }

    if ($row.page -eq '116') {
        $row.question_number = '22'
        $row.passage = 'Points $A$, $B$, $C$, and $E$ lie on a circle. Chords $AC$ and $BE$ intersect perpendicularly at $D$, $AB<BC$, $BD=\sqrt{346}$, and the circle has diameter 175.'
        $row.question = 'If $\frac{CD}{AD}=r$, what is the value of $r$?'
    }
}
$mathOpen | Export-Csv -LiteralPath $mathOpenPath -NoTypeInformation -Encoding utf8

Write-Output "Cleaned: RW=$($reading.Count), Math MCQ=$($mathMcq.Count), Math open=$($mathOpen.Count)"
