# ----------------------------------------------------------------------------
# Copyright (c) 2018--, rankratioviz development team.
#
# NOTE: This is based on DEICODE's deicode/q2/plugin_setup.py file.
#
# Distributed under the terms of the Modified BSD License.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# ----------------------------------------------------------------------------
import qiime2.plugin
import qiime2.sdk
from rankratioviz import __version__
from ._method import plot
from qiime2.plugin import (Str, Metadata, Properties)
from q2_types.feature_table import (FeatureTable, Frequency)
from q2_types.ordination import PCoAResults

plugin = qiime2.plugin.Plugin(
    name='rankratioviz',
    version=__version__,
    website="https://github.com/fedarko/rankratioviz",
    # citations=[citations['martino-unpublished']],
    short_description=('Plugin for visualizing taxon ranks and log ratios.'),
    description=("""This plugin supports the visualization of taxon ranks, output
        by a tool like songbird or DEICODE, in tandem with log ratios of their
        abundances in samples."""),
    package='rankratioviz')

plugin.visualizers.register_function(
    function=plot,
    inputs={'ranks': PCoAResults % Properties("biplot"),
            'table': FeatureTable[Frequency]},
    parameters={'sample_metadata': Metadata,
                'feature_metadata': Metadata,
                'in_category': Str},
    input_descriptions={
        # TODO clearer descriptions here
        'ranks': 'The principal coordinates matrix to be plotted in biplots.',
        'table': 'A table of counts'
    },
    parameter_descriptions={
        'sample_metadata': 'The sample metadata',
        'feature_metadata': 'The feature metadata (useful to manipulate the '
                            'arrows in the plot).',
        'in_category': 'metadata category to plot'
        },
    name='Generate a rankratioviz plot',
    description="""Generates an interactive visualization of ranks in tandem
    with a visualization of the log ratios of selected ranks' sample
    abundance."""
)
