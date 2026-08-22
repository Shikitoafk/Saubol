$ErrorActionPreference = 'Stop'

$OutputDir = Join-Path $PSScriptRoot '..\output\sat_parser\2024-dec-int-b'

function Remove-ImageDependency($row) {
    $row.has_image = 'False'
    $row.image_url = ''
}

$readingPath = Join-Path $OutputDir 'ebrw_mcq.csv'
$reading = @(Import-Csv -LiteralPath $readingPath)
foreach ($row in $reading) {
    if ($row.has_image -ne 'True') { continue }
    Remove-ImageDependency $row
    switch ($row.page) {
        '23' {
            $row.passage = "Total areas of five Hawaiian home lands (square miles): Kawaihae, 15.99; Kamoku-Kapulena, 7.47; Kahikinui, 37.26; Makuu, 3.44; Hoolehua-Palaau, 21.61.`n`nHawaiian home lands are areas of public land in the state of Hawaii that have been reserved for use by the Kānaka Maoli, or the Native Hawaiian people. The largest of the home lands, Homuula-Upper Piihonua, covers nearly 100 square miles on the island of Hawai'i. Most of the home lands are much smaller. For example, the total area of Kamoku-Kapulena is 7.47 square miles, and the total area of Makuu is ______"
        }
        '36' {
            $row.passage = "Cougar population-density estimates (cougars per 100 square kilometers): Ross and Jalkotzy, radio-collar tracking, minimum 2.70, maximum 4.70, range 2.00; Davidson et al., scat-detecting dogs, minimum 2.31, maximum 5.50, range 3.19; Choate et al., helicopter surveying, minimum 5.59, maximum 10.24, range 4.65; Sollmann et al., infrared camera trapping and GPS, minimum 1.46, maximum 1.51, range 0.05.`n`nResearchers have used several methods to estimate cougar population density. A student claims that scat-detecting dogs produce the most precise results, meaning the smallest difference between minimum and maximum estimates."
            $row.correct_answer = 'C'
        }
        '37' {
            $row.passage = "Highest major summits in India: Kangto—elevation 7,060 meters, Assam Himalaya, prominence 2,195 meters; Saser Kangri III—elevation 7,495 meters, Saser Karakoram, prominence 850 meters; Langpo—elevation 6,965 meters, Sikkim Himalaya, prominence 560 meters; Sri Kailash—elevation 6,932 meters, Garhwal Himalaya, prominence 1,092 meters; Mount Lakshmi—elevation 6,983 meters, Rimo Karakoram, prominence 800 meters.`n`nMountain summits are often described in terms of their elevation, or height above sea level. But a summit's elevation may not be as good an indication of how high the mountain appears to observers as is the summit's prominence, or its height above its surroundings, and these values can differ significantly. For example, the Indian mountain of ______"
        }
        '40' {
            $row.passage = "Correlations between model-predicted and participant-reported enjoyment ratings were approximately as follows: for impressionist paintings, P1 0.58, P3 0.42, and P6 0.38; for color-field paintings, P1 0.14, P3 0.10, and P6 0.10.`n`nNeuroscientist Kiyohito Iigaya and colleagues developed a computational model to predict how much a person will enjoy a particular work of art on a scale from 1 (not at all) to 4 (very much). They recruited participants to rate sets of paintings in various styles and calculated the correlation between ratings predicted by the model and ratings reported by the participants. Assuming participant P1 gave equal ratings to the impressionist and color-field paintings, the data suggest that the model predicted that ______"
            $row.correct_answer = 'D'
        }
    }
}
$reading | Export-Csv -LiteralPath $readingPath -NoTypeInformation -Encoding utf8

$mathMcqPath = Join-Path $OutputDir 'math_mcq.csv'
$mathMcq = @(Import-Csv -LiteralPath $mathMcqPath)
foreach ($row in $mathMcq) {
    if ($row.has_image -ne 'True') { continue }
    Remove-ImageDependency $row
    switch ($row.page) {
        '55' {
            $row.passage = 'Two lines intersect. The vertically opposite angles are labeled $w$ and $z$.'
        }
        '58' {
            $row.passage = 'A scatterplot has a line of best fit with a y-intercept of about 0.1 and a slope of about 1.1.'
        }
        '66' {
            $row.passage = 'A graph models the number of active projects as a function of months after November 2013. At $x=0$, the graph has value 5; it rises to about 9 at $x=4$ and then falls to about 8 at $x=6$.'
        }
        '71' {
            $row.passage = 'Among 80 students, favorite core subjects were distributed as follows: English 22 students, mathematics 20, science 14, and social studies 24.'
        }
        '77' {
            $row.passage = 'Line $h$ passes through $(-5,0)$ and $(0,-9)$, so it can be written as $72x+40y=-360$.'
        }
        '81' {
            $row.passage = 'A straight line and an upward-opening parabola intersect at the point $(-1,4)$, as shown by their graph.'
            $row.option_d = '$(1, 4)$'
        }
        '91' {
            $row.passage = 'In triangle $XYZ$, $\angle X=54^\circ$, $XY=26$, and $XZ=19$. An altitude from $Z$ to $XY$ is shown.'
        }
    }
}
$mathMcq | Export-Csv -LiteralPath $mathMcqPath -NoTypeInformation -Encoding utf8

$mathOpenPath = Join-Path $OutputDir 'math_open.csv'
$mathOpen = @(Import-Csv -LiteralPath $mathOpenPath)
foreach ($row in $mathOpen) {
    if ($row.has_image -ne 'True') { continue }
    Remove-ImageDependency $row
    switch ($row.page) {
        '70' {
            $row.passage = 'The table gives $f(-37)=4$, $f(-9)=0$, and $f(33)=6$, where $f(x)=\frac{kx+45}{x+2}$ and $k$ is a constant.'
        }
        '89' {
            $row.passage = 'Segments $PR$ and $ST$ intersect at $Q$. Angles $PTQ$ and $RSQ$ are congruent, so triangles $PTQ$ and $RSQ$ are similar. The lengths are $PQ=4,900$, $TQ=9,800$, $QS=1,400$, and $RS=1,400$ feet. The unknown distance across the pond is $PT=x$.'
        }
    }
}
$mathOpen | Export-Csv -LiteralPath $mathOpenPath -NoTypeInformation -Encoding utf8

Write-Output "Cleaned image dependencies for December 2024 Int-B"
