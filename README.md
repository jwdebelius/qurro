# rankratioviz
[![Build Status](https://travis-ci.org/fedarko/rankratioviz.svg?branch=master)](https://travis-ci.org/fedarko/rankratioviz)

(Name subject to change.)

rankratioviz visualizes the output from a tool like
[songbird](https://github.com/mortonjt/songbird) or
[DEICODE](https://github.com/biocore/DEICODE). It facilitates viewing
a __"ranked"__ plot of features (generally taxa or metabolites) alongside
a scatterplot showing the __log ratios__ of selected feature counts within samples.

rankratioviz can be used standalone (as a Python 3 script that generates a
HTML/JS/CSS visualization) or as a [QIIME 2](https://qiime2.org/) plugin (that generates a QZV file that can be visualized at [view.qiime2.org](https://view.qiime2.org/)).
**We're
currently focused on restructuring the tool's codebase, so please bear with us as
we make these enhancements available.**

rankratioviz is still being developed, so backwards-incompatible changes might
occur. If you have any questions, feel free to contact the development team at
[mfedarko@ucsd.edu](mailto:mfedarko@ucsd.edu).

You can view a demo of rankratioviz in the browser [here](https://fedarko.github.io/rrv/).

## Installation and Usage

The following command will install the most up-to-date version of rankratioviz:
```
# Developer version
pip install git+https://github.com/fedarko/rankratioviz.git
```

### Using rankratioviz through [QIIME 2](https://qiime2.org/)

In order to use songbird `FeatureData[Differential]` outputs with rankratioviz
through QIIME 2, [songbird](https://github.com/mortonjt/songbird/) needs to be
installed. (You can still work with songbird outputs in rankratioviz'
standalone mode, however.)

First, make sure that QIIME 2 is installed before installing rankratioviz.
Then run

```
qiime dev refresh-cache
```

A full example can be analysis from count table to visualization can be found
[here](https://github.com/fedarko/rankratioviz/blob/master/example/deicode_all.ipynb).
(Note that some of the command syntax is a little out-of-date.)
A visualization.qzv file containing a rankratioviz visualization
can be produced using the command below, and can be visualized by dragging/uploading
the visualization.qzv file to
[view.qiime2.org](https://view.qiime2.org/).

```
qiime rankratioviz unsupervised-rank-plot --i-ranks example/deicode_example/ordination.qza \
                                          --i-table example/deicode_example/qiita_10422_table.biom.qza \
                                          --m-sample-metadata-file example/deicode_example/qiita_10422_metadata_encode.tsv \
                                          --m-feature-metadata-file example/deicode_example/taxonomy.tsv \
                                          --output-dir example/deicode_example/q2_rrv_plot
```

### Using rankratioviz as a standalone program

rankratioviz can also be used on its own from the command line outside of QIIME 2.
The following command produces an analogous visualization to the one generated
with QIIME 2 above:

```
rankratioviz --ranks example/deicode_example/ordination.txt \
             --table example/deicode_example/qiita_10422_table.biom \
             --sample-metadata example/deicode_example/qiita_10422_metadata_encode.tsv \
             --feature-metadata example/deicode_example/taxonomy.tsv \
             --output-dir example/deicode_example/standalone_rrv_plot
```

This visualization can be displayed by running `python3 -m http.server` from
the output directory containing the visualization (in this case,
`example/deicode_example/standalone_rrv_plot`) and opening `localhost:8000` in
your browser (replacing `8000` with the port number that you got from running
the command).

You can also host the generated visualization on a simple web server (making it
accessible to anyone).

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

![Screenshot](https://github.com/fedarko/rankratioviz/blob/master/screenshots/redsea_data.png)

This visualization (which uses the [Red Sea data](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5315489/), with ranks generated by songbird) can be viewed online [here](https://view.qiime2.org/visualization/?type=html&src=https%3A%2F%2Fdl.dropbox.com%2Fs%2Ftai1wilcd8mcovd%2Fredsea_final_ish.qzv).

## Acknowledgements

Code files for the following three projects are distributed within
`rankratioviz/support_file/vendor/`.
See the `dependency_licenses/` directory for copies of these software projects'
licenses (each of which includes a respective copyright notice).
- [Vega](https://vega.github.io/vega/)
- [Vega-Lite](https://vega.github.io/vega-lite/)
- [Vega-Embed](https://github.com/vega/vega-embed)

The following software projects are required for rankratioviz's python code
to function, although they are not distributed with rankratioviz (and are
instead installed alongside rankratioviz).
- [Python 3](https://www.python.org/) (a version of at least 3.5 is required)
- [Altair](https://altair-viz.github.io/)
- [biom-format](http://biom-format.org/)
- [click](https://palletsprojects.com/p/click/)
- [pandas](https://pandas.pydata.org/)
- [scikit-bio](http://scikit-bio.org/)

rankratioviz also uses [pytest](https://docs.pytest.org/en/latest/) and
[flake8](http://flake8.pycqa.org/en/latest/).

The design of rankratioviz was strongly inspired by
[EMPeror](https://github.com/biocore/emperor) and
[q2-emperor](https://github.com/qiime2/q2-emperor/), along with
[DEICODE](https://github.com/biocore/DEICODE). A big shoutout to
Yoshiki Vázquez-Baeza for his help in planning this project, as well as to
Cameron Martino for a ton of work on getting the code in a distributable state
(and making it work with QIIME 2). Thanks also to Jamie Morton, who wrote the
original code for producing rank plots from which this is derived.

Some of the test data (located in `rankratioviz/tests/input/byrd/`) was taken
from [this repository](https://github.com/knightlab-analyses/reference-frames).
This data, in turn, originates from Byrd et al.'s 2017 study on atopic
dermatitis [2].

## References

[1] Becker, R. A. & Cleveland, W. S. (1987). Brushing scatterplots. _Technometrics, 29_(2), 127-142. (Section 4.1 in particular talks about linking visualizations.)

[2] Byrd, A. L., Deming, C., Cassidy, S. K., Harrison, O. J., Ng, W. I., Conlan, S., ... & NISC Comparative Sequencing Program. (2017). Staphylococcus aureus and Staphylococcus epidermidis strain diversity underlying pediatric atopic dermatitis. _Science translational medicine, 9_(397), eaal4651.

## License

This tool is licensed under the [BSD 3-clause license](https://en.wikipedia.org/wiki/BSD_licenses#3-clause_license_(%22BSD_License_2.0%22,_%22Revised_BSD_License%22,_%22New_BSD_License%22,_or_%22Modified_BSD_License%22)).
Our particular version of the license is based on [scikit-bio](https://github.com/biocore/scikit-bio)'s [license](https://github.com/biocore/scikit-bio/blob/master/COPYING.txt).
