# rankratioviz
[![Build Status](https://travis-ci.org/fedarko/rankratioviz.svg?branch=master)](https://travis-ci.org/fedarko/rankratioviz)

(Name subject to change.)

This tool visualizes the [Biplot-OrdinationResults](http://scikit-bio.org/docs/0.5.1/generated/generated/skbio.stats.ordination.OrdinationResults.html) output from a tool like
[songbird](https://github.com/mortonjt/songbird). It facilitates viewing
a __"ranked"__ plot of taxa alongside a scatterplot showing the __log ratios__ of
selected taxon abundances within samples.

This tool is still being developed, so backwards-incompatibile changes might
occur. If you have any questions, feel free to contact me at mfedarko@ucsd.edu.

You can view a demo of RankRatioViz [here](https://fedarko.github.io/rrv/).

## Installation

To install the most up to date version of deicode, run the following command
```
# dev. version
pip install git+https://github.com/fedarko/rankratioviz.git
```
Then run the following command to refresh qiime2

```
qiime dev refresh-cache
```

### Qiime2 tutorial

First make sure that qiime2 is installed before installing deicode. Then run

```
qiime dev refresh-cache
```

A full example can be analysis from count table to visualization can be found [here](https://github.com/cameronmartino/rankratioviz/blob/master/example/deicode.ipynb). Once a file of type Biplot-OrdinationResults (i.e. ordination.qza in the example) is made the visualization can be made using the command below and visualized by dragging the file onto [this](https://view.qiime2.org/) page. 

```
!qiime rankratioviz rank-plot --i-table example/deicode_example/qiita_10422_table.biom.qza \
                              --i-ranks example/deicode_example/ordination.qza \
                              --m-sample-metadata-file example/deicode_example/qiita_10422_metadata_encode.tsv \
                              --m-feature-metadata-file example/deicode_example/taxonomy.tsv \
                              --p-in-catagory example/exposure_type_encode \
                              --output-dir example/deicode_example/rank_plot
```

### Stand alone command line tutorial

Simillar to the command above this is preceeded by the command to produce .

```
!rankratioviz_rankplot \
--ranks example/deicode_example/ordination.txt \
--in_biom example/deicode_example/qiita_10422_table.biom \
--in_metadata example/deicode_example/qiita_10422_metadata_encode.tsv \
--in_taxonomy example/deicode_example/taxonomy.tsv \
--output_dir example/deicode_example --in_catagory exposure_type_encode
```

## Linked visualizations
These two visualizations (the rank plot and sample scatterplot) are linked [1]:
selections in the rank plot modify the scatterplot of samples, and
modifications of the sample scatterplot that weren't made through the rank plot
trigger an according update in the rank plot.

To elaborate on that: clicking on two taxa in the rank plot sets a new
numerator taxon (determined from the first-clicked taxon) and a new denominator
taxon (determined from the second-clicked taxon) for the abundance log ratios
in the scatterplot of samples.

You can also run textual queries over the various taxa definitions, in order to
create more complicated log ratios
(e.g. "the log ratio of the combined abundances of all
taxa with rank X over the combined abundances of all taxa with rank Y").
Although this method doesn't require you to manually select taxa on the rank
plot, the rank plot is still updated to indicate the taxa used in the log
ratios.

## Screenshot

![Screenshot of the log ratio of the combined abundances of all taxa with the rank 'Staphylococcus' over the combined abundances of all taxa with the rank 'Propionibacterium.'](https://raw.githubusercontent.com/fedarko/rankratioviz/master/screenshots/genera.png)
_Screenshot of the log ratio of the combined abundances of all taxa with the rank "Staphylococcus" over the combined abundances of all taxa with the rank "Propionibacterium." This visualization was created using sample data from Byrd et al. 2017 [2]; this data is included in the `data/byrd` folder of this repository._

## Tools used

Loaded via CDN in the web visualization interface:
- [Vega](https://vega.github.io/vega/)
- [Vega-Lite](https://vega.github.io/vega-lite/)
- [Vega-Embed](https://github.com/vega/vega-embed)

Used to generate input JSON files for the visualization interface in
`gen_plots.py`:
- [Python 3](https://www.python.org/) (a version of at least 3.2 is required)
- [NumPy](http://www.numpy.org/)
- [pandas](https://pandas.pydata.org/)
- [biom-format](http://biom-format.org/)
- [Altair](https://altair-viz.github.io/)

## References

[1] Becker, R. A. & Cleveland, W. S. (1987). Brushing scatterplots. _Technometrics, 29_(2), 127-142. (Section 4.1 in particular talks about linking visualizations.)

[2] Byrd, A. L., Deming, C., Cassidy, S. K., Harrison, O. J., Ng, W. I., Conlan, S., ... & NISC Comparative Sequencing Program. (2017). Staphylococcus aureus and Staphylococcus epidermidis strain diversity underlying pediatric atopic dermatitis. _Science translational medicine, 9_(397), eaal4651.

## License

This tool is licensed under the [BSD 3-clause license](https://en.wikipedia.org/wiki/BSD_licenses#3-clause_license_(%22BSD_License_2.0%22,_%22Revised_BSD_License%22,_%22New_BSD_License%22,_or_%22Modified_BSD_License%22)).
Our particular version of the license is based on [scikit-bio](https://github.com/biocore/scikit-bio)'s [license](https://github.com/biocore/scikit-bio/blob/master/COPYING.txt).
