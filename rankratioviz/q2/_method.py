# ----------------------------------------------------------------------------
# Copyright (c) 2018--, rankratioviz development team.
#
# Distributed under the terms of the Modified BSD License.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# ----------------------------------------------------------------------------
import qiime2
import skbio
import biom
import q2templates
from rankratioviz.generate import process_input, gen_visualization


def plot(output_dir: str, ranks: skbio.OrdinationResults, table: biom.Table,
         sample_metadata: qiime2.Metadata, feature_metadata: qiime2.Metadata,
         category: str) -> None:
    """Generates a .qzv file containing a rankratioviz visualization.

       (...Also, the reason the order of parameters here differs from
       rankratioviz/scripts/_plot.py is that the first parameter has to be
       output_dir: str, per QIIME 2's plugin requirements.)
    """
    # get data
    df_feature_metadata = feature_metadata.to_dataframe()
    V, processed_table = process_input(ranks, table, df_feature_metadata)
    # We can't "subscript" Q2 Metadata types, so we have to convert this to a
    # dataframe before working with it
    df_sample_metadata = sample_metadata.to_dataframe()
    index_path = gen_visualization(V, processed_table, df_sample_metadata,
                                   category, output_dir)
    # render the visualization using q2templates.render().
    # TODO: do we need to specify plot_name in the context in this way? I'm not
    # sure where it is being used in the first place, honestly.
    plot_name = output_dir.split('/')[-1]
    q2templates.render(index_path, output_dir,
                       context={'plot_name': plot_name})
