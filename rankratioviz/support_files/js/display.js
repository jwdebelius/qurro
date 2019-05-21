/* This file contains most of the code that manages the details of a
 * rankratioviz visualization.
 *
 * RRVDisplay.makeRankPlot() and RRVDisplay.makeSamplePlot() were based on the
 * Basic Example in https://github.com/vega/vega-embed/.
 */
define(["./feature_computation", "vega", "vega-embed"], function(
    feature_computation,
    vega,
    vegaEmbed
) {
    class RRVDisplay {
        /* Class representing a display in rankratioviz (involving two plots:
         * one bar plot containing feature ranks, and one scatterplot
         * describing sample log ratios of feature abundances). These plots are
         * referred to in this code as the "rank" and "sample" plot,
         * respectively.
         *
         * Its constructor takes as arguments JSON objects representing the rank
         * and sample plot in Vega-Lite (these should be generated by
         * rankratioviz' python code).
         *
         * This class assumes that a few DOM elements exist on the page in
         * order to function properly. The most notable of these are two
         * <div> elements -- one with the ID "rankPlot" and one with the ID
         * "samplePlot" -- in which Vega visualizations of these plots will be
         * embedded using Vega-Embed.
         *
         * (It'd be possible in the future to make the IDs used to find these
         * DOM elements configurable in the class constructor, but I don't
         * think that would be super useful unless you want to embed
         * rankratioviz' web interface in a bunch of other environments.)
         */
        constructor(rankPlotJSON, samplePlotJSON, countJSON) {
            // Used for selections of log ratios between single features (via
            // the rank plot)
            this.onHigh = true;
            this.newFeatureLow = undefined;
            this.newFeatureHigh = undefined;
            this.oldFeatureLow = undefined;
            this.oldFeatureHigh = undefined;

            // For selections of potentially many features (not via the rank plot)
            this.topFeatures = undefined;
            this.botFeatures = undefined;

            // Used when looking up a feature's count.
            this.feature_cts = countJSON;
            // Used when searching through features.
            this.feature_ids = Object.keys(this.feature_cts);

            // Set when the sample plot JSON is loaded. Used to populate
            // possible sample plot x-axis/colorization options.
            this.metadataCols = undefined;

            // Ordered list of all ranks
            this.rankOrdering = undefined;

            this.rankPlotView = undefined;
            this.samplePlotView = undefined;

            // Actually create the visualization
            this.rankPlotJSON = rankPlotJSON;
            this.samplePlotJSON = samplePlotJSON;
            this.makePlots();

            // Set up relevant DOM bindings
            var display = this;
            this.elementsWithOnClickBindings = RRVDisplay.setUpDOMBindings({
                multiFeatureButton: function() {
                    display.updateSamplePlotMulti();
                },
                exportDataButton: function() {
                    display.exportData();
                }
            });
            this.elementsWithOnChangeBindings = RRVDisplay.setUpDOMBindings(
                {
                    xAxisField: function() {
                        display.updateSamplePlotField("xAxis");
                    },
                    colorField: function() {
                        display.updateSamplePlotField("color");
                    },
                    xAxisScale: function() {
                        display.updateSamplePlotScale("xAxis");
                    },
                    colorScale: function() {
                        display.updateSamplePlotScale("color");
                    },
                    rankField: function() {
                        display.updateRankField();
                    },
                    barSize: function() {
                        display.updateRankPlotBarSize(true);
                    },
                    boxplotCheckbox: function() {
                        display.updateSamplePlotBoxplot();
                    }
                },
                "onchange"
            );
        }

        /* Assigns DOM bindings to elements.
         *
         * If eventHandler is set to "onchange", this will update the onchange
         * event handler for these elements. Otherwise, this will update the
         * onclick event handler.
         */
        static setUpDOMBindings(elementID2function, eventHandler) {
            var elementIDs = Object.keys(elementID2function);
            var currID;
            for (var i = 0; i < elementIDs.length; i++) {
                currID = elementIDs[i];
                if (eventHandler === "onchange") {
                    document.getElementById(currID).onchange =
                        elementID2function[currID];
                } else {
                    document.getElementById(currID).onclick =
                        elementID2function[currID];
                }
            }
            return elementIDs;
        }

        makePlots() {
            this.makeRankPlot();
            this.makeSamplePlot();
        }

        makeRankPlot(notFirstTime) {
            if (!notFirstTime) {
                this.rankOrdering = this.rankPlotJSON.datasets.rankratioviz_rank_ordering;
                RRVDisplay.populateSelectDOM(
                    "rankField",
                    this.rankOrdering,
                    this.rankOrdering[0]
                );
                // Figure out which bar size type to default to.
                // We determine this based on how many features there are.
                // This is intended to address cases where there are only a few
                // ranked features (e.g. the matching test) -- in these cases,
                // fitting actually increases the bar sizes to be reasonable to
                // view/select.
                if (
                    this.feature_ids.length <=
                    this.rankPlotJSON.config.view.width
                ) {
                    document.getElementById("barSize").value = "fit";
                    this.updateRankPlotBarSize(false);
                }
            }
            // Set the y-axis to say "Rank: [rank title]" instead of just
            // "[rank title]". Makes things a bit clearer.
            this.rankPlotJSON.encoding.y.title =
                "Rank: " + this.rankPlotJSON.encoding.y.field;
            // We can use a closure to allow callback functions to access "this"
            // (and thereby change the properties of instances of the RRVDisplay
            // class). See https://stackoverflow.com/a/5106369/10730311.
            var parentDisplay = this;
            // We specify a "custom" theme which matches with the
            // "custom"-theme tooltip CSS.
            vegaEmbed("#rankPlot", this.rankPlotJSON, {
                tooltip: { theme: "custom" }
            }).then(function(result) {
                parentDisplay.rankPlotView = result.view;
                parentDisplay.addClickEventToRankPlotView(parentDisplay);
            });
        }

        addClickEventToRankPlotView(display) {
            // Set callbacks to let users make selections in the ranks plot
            display.rankPlotView.addEventListener("click", function(e, i) {
                if (i !== null && i !== undefined) {
                    if (i.mark.marktype === "rect") {
                        if (display.onHigh) {
                            display.oldFeatureHigh = display.newFeatureHigh;
                            display.newFeatureHigh = i.datum["Feature ID"];
                            console.log(
                                "Set newFeatureHigh: " + display.newFeatureHigh
                            );
                        } else {
                            display.oldFeatureLow = display.newFeatureLow;
                            display.newFeatureLow = i.datum["Feature ID"];
                            console.log(
                                "Set newFeatureLow: " + display.newFeatureLow
                            );
                            display.updateSamplePlotSingle();
                        }
                        display.onHigh = !display.onHigh;
                    }
                }
            });
        }

        /* Populates a <select> DOM element with a list of options. */
        static populateSelectDOM(selectID, optionList, defaultVal) {
            var optionEle;
            var selectEle = document.getElementById(selectID);
            for (var m = 0; m < optionList.length; m++) {
                optionEle = document.createElement("option");
                optionEle.value = optionEle.text = optionList[m];
                selectEle.appendChild(optionEle);
            }
            // Set the default value of the <select>. Note that we escape this
            // value in quotes, just in case it contains a period or some other
            // character(s) that would mess up the querySelector.
            selectEle.querySelector(
                'option[value = "' + defaultVal + '"]'
            ).selected = true;
        }

        /* Calls vegaEmbed() on this.samplePlotJSON.
         *
         * If notFirstTime is falsy, this will initialize some important
         * properties of this RRVDisplay object related to the sample plot
         * (e.g. the metadata columns and feature count information).
         *
         * If you're just calling this function to remake the sample plot with
         * one thing changed (e.g. to change a scale), then it's best to set
         * notFirstTime to true -- in which case this won't do that extra work.
         */
        makeSamplePlot(notFirstTime) {
            if (!notFirstTime) {
                this.metadataCols = RRVDisplay.identifyMetadataColumns(
                    this.samplePlotJSON
                );
                // Note that we set the default metadata fields based on whatever
                // the JSON has as the defaults.
                RRVDisplay.populateSelectDOM(
                    "xAxisField",
                    this.metadataCols,
                    this.samplePlotJSON.encoding.x.field
                );
                RRVDisplay.populateSelectDOM(
                    "colorField",
                    this.metadataCols,
                    this.samplePlotJSON.encoding.color.field
                );
            }
            this.updateSamplePlotTooltips();
            // NOTE: Use of "patch" based on
            // https://beta.observablehq.com/@domoritz/rotating-earth
            var parentDisplay = this;
            vegaEmbed("#samplePlot", this.samplePlotJSON).then(function(
                result
            ) {
                parentDisplay.samplePlotView = result.view;
            });
        }

        // Given a "row" of data about a rank, return its new classification depending
        // on the new selection that just got made.
        updateRankColorSingle(rankRow) {
            if (rankRow["Feature ID"] === this.newFeatureHigh) {
                if (rankRow["Feature ID"] === this.newFeatureLow) {
                    return "Both";
                } else {
                    return "Numerator";
                }
            } else if (rankRow["Feature ID"] === this.newFeatureLow) {
                return "Denominator";
            } else {
                return "None";
            }
        }

        updateRankColorMulti(rankRow) {
            var inTop = false;
            var inBot = false;
            if (this.topFeatures.indexOf(rankRow["Feature ID"]) >= 0) {
                inTop = true;
            }
            if (this.botFeatures.indexOf(rankRow["Feature ID"]) >= 0) {
                inBot = true;
            }
            if (inTop) {
                if (inBot) {
                    return "Both";
                } else {
                    return "Numerator";
                }
            } else if (inBot) {
                return "Denominator";
            } else {
                return "None";
            }
        }

        updateRankField() {
            var newRank = document.getElementById("rankField").value;
            this.rankPlotJSON.encoding.y.field = newRank;
            // NOTE that this assumes that the rank plot only has one transform
            // being used, and that it's a "rank" window transform. (This is a
            // reasonable assumption, since we generate the rank plot.)
            this.rankPlotJSON.transform[0].sort[0].field = newRank;
            this.remakeRankPlot();
        }

        remakeRankPlot() {
            this.destroy(true, false, false);
            this.makeRankPlot(true);
        }

        updateRankPlotBarSize(callRemakeRankPlot) {
            var newSizeType = document.getElementById("barSize").value;
            var newBarSize;
            if (newSizeType === "fit") {
                // Not 100% sure this is optimal.
                newBarSize =
                    this.rankPlotJSON.config.view.width /
                    this.feature_ids.length;
            } else {
                newBarSize = parseInt(newSizeType);
            }
            this.rankPlotJSON.encoding.x.scale.rangeStep = newBarSize;
            if (newBarSize < 1) {
                document
                    .getElementById("barSizeWarning")
                    .classList.remove("invisible");
            } else {
                document
                    .getElementById("barSizeWarning")
                    .classList.add("invisible");
            }
            if (callRemakeRankPlot) {
                this.remakeRankPlot();
            }
        }

        changeSamplePlot(updateBalanceFunc, updateRankColorFunc) {
            var dataName = this.samplePlotJSON.data.name;
            var parentDisplay = this;
            this.samplePlotView
                .change(
                    dataName,
                    vega.changeset().modify(
                        /* Calculate the new balance for each sample.
                         *
                         * For reference, the use of modify() here is based on this comment:
                         * https://github.com/vega/vega/issues/1028#issuecomment-334295328
                         * (This is where I learned that vega.changeset().modify() existed.)
                         * Also, vega.truthy is a utility function: it just returns true.
                         */
                        vega.truthy,
                        "rankratioviz_balance",
                        // function to run to determine what the new balances are
                        function(sampleRow) {
                            return updateBalanceFunc.call(
                                parentDisplay,
                                sampleRow
                            );
                        }
                    )
                )
                .run();
            // Update rank plot based on the new log ratio
            // Storing this within changeSamplePlot() is a (weak) safeguard that
            // changes to the state of the sample plot (at least enacted using the UI
            // controls on the page, not the dev console) also propagate to the rank
            // plot.
            var rankDataName = this.rankPlotJSON.data.name;
            this.rankPlotView
                .change(
                    rankDataName,
                    vega
                        .changeset()
                        .modify(vega.truthy, "Classification", function(
                            rankRow
                        ) {
                            return updateRankColorFunc.call(
                                parentDisplay,
                                rankRow
                            );
                        })
                )
                .run();
        }

        updateSamplePlotMulti() {
            // Determine how we're going to use the input for searching through
            // features
            var topType = document.getElementById("topSearch").value;
            var botType = document.getElementById("botSearch").value;
            var topEnteredText = document.getElementById("topText").value;
            var botEnteredText = document.getElementById("botText").value;
            // Now use these "types" to filter features for both parts of the log ratio
            this.topFeatures = feature_computation.filterFeatures(
                this.feature_ids,
                topEnteredText,
                topType
            );
            this.botFeatures = feature_computation.filterFeatures(
                this.feature_ids,
                botEnteredText,
                botType
            );
            this.changeSamplePlot(
                this.updateBalanceMulti,
                this.updateRankColorMulti
            );
            // Update features text displays
            this.updateFeaturesTextDisplays();
        }

        updateSamplePlotSingle() {
            if (
                this.newFeatureLow !== undefined &&
                this.newFeatureHigh !== undefined
            ) {
                if (
                    this.newFeatureLow !== null &&
                    this.newFeatureHigh !== null
                ) {
                    var lowsDiffer = this.oldFeatureLow != this.newFeatureLow;
                    var highsDiffer =
                        this.oldFeatureHigh != this.newFeatureHigh;
                    if (lowsDiffer || highsDiffer) {
                        // Time to update the sample scatterplot regarding new
                        // microbes.
                        this.changeSamplePlot(
                            this.updateBalanceSingle,
                            this.updateRankColorSingle
                        );
                        this.updateFeaturesTextDisplays(true);
                    }
                }
            }
        }

        updateFeatureHeaderCounts(topCt, botCt) {
            document.getElementById("numHeader").innerHTML =
                "Numerator Features (" + topCt.toLocaleString() + " selected)";
            document.getElementById("denHeader").innerHTML =
                "Denominator Features (" +
                botCt.toLocaleString() +
                " selected)";
        }

        /* Updates the textareas that list the selected features.
         *
         * This defaults to updating based on the "multiple" selections' values. If you
         * pass in a truthy value for the clear argument, this will instead clear these
         * text areas; if you pass in a truthy value for the single argument (and clear
         * is falsy), this will instead update based on the single selection values.
         */
        updateFeaturesTextDisplays(single, clear) {
            if (clear) {
                document.getElementById("topFeaturesDisplay").value = "";
                document.getElementById("botFeaturesDisplay").value = "";
            } else if (single) {
                document.getElementById(
                    "topFeaturesDisplay"
                ).value = this.newFeatureHigh;
                document.getElementById(
                    "botFeaturesDisplay"
                ).value = this.newFeatureLow;
                this.updateFeatureHeaderCounts(1, 1);
            } else {
                document.getElementById(
                    "topFeaturesDisplay"
                ).value = this.topFeatures.toString().replace(/,/g, "\n");
                document.getElementById(
                    "botFeaturesDisplay"
                ).value = this.botFeatures.toString().replace(/,/g, "\n");
                this.updateFeatureHeaderCounts(
                    this.topFeatures.length,
                    this.botFeatures.length
                );
            }
        }

        updateSamplePlotTooltips() {
            if (!document.getElementById("boxplotCheckbox").checked) {
                // NOTE: this should be safe from duplicate entries within
                // tooltips so long as you don't change the field titles
                // displayed.
                this.samplePlotJSON.encoding.tooltip = [
                    { type: "nominal", field: "Sample ID" },
                    { type: "quantitative", field: "rankratioviz_balance" },
                    {
                        type: this.samplePlotJSON.encoding.x.type,
                        field: this.samplePlotJSON.encoding.x.field
                    },
                    {
                        type: this.samplePlotJSON.encoding.color.type,
                        field: this.samplePlotJSON.encoding.color.field
                    }
                ];
            }
        }

        /* Update color so that color encoding matches the x-axis encoding
         * (due to how box plots work in Vega-Lite). To be clear, we also
         * update the color field <select> to show the user what's going on.
         */
        setColorForBoxplot() {
            var category = this.samplePlotJSON.encoding.x.field;
            this.samplePlotJSON.encoding.color.field = category;
            document.getElementById("colorField").value = category;
            document.getElementById("colorScale").value = "nominal";
            this.samplePlotJSON.encoding.color.type = "nominal";
        }

        updateSamplePlotField(vizAttribute) {
            if (vizAttribute === "xAxis") {
                this.samplePlotJSON.encoding.x.field = document.getElementById(
                    "xAxisField"
                ).value;
                if (
                    document.getElementById("boxplotCheckbox").checked &&
                    this.samplePlotJSON.encoding.x.type === "nominal"
                ) {
                    this.setColorForBoxplot();
                }
            } else {
                this.samplePlotJSON.encoding.color.field = document.getElementById(
                    "colorField"
                ).value;
            }
            this.remakeSamplePlot();
        }

        remakeSamplePlot() {
            // Clear out the sample plot. NOTE that I'm not sure if this is
            // 100% necessary, but it's probs a good idea to prevent memory
            // waste.
            this.destroy(false, true, false);
            this.makeSamplePlot(true);
        }

        /* Changes the scale type of either the x-axis or colorization in the
         * sample plot. This isn't doable with Vega signals -- we need to
         * literally reload the Vega-Lite specification with the new scale
         * type in order to make these changes take effect.
         */
        updateSamplePlotScale(vizAttribute) {
            if (vizAttribute === "xAxis") {
                var newScale = document.getElementById("xAxisScale").value;
                this.samplePlotJSON.encoding.x.type = newScale;
                // This assumes that the x-axis specification only has the
                // labelAngle parameter.
                if (newScale === "nominal") {
                    this.samplePlotJSON.encoding.x.axis = { labelAngle: -45 };
                    if (document.getElementById("boxplotCheckbox").checked) {
                        this.changeSamplePlotToBoxplot(false);
                    }
                } else {
                    this.changeSamplePlotFromBoxplot(false);
                    // This should work even if the axis property is undefined
                    // -- it just won't do anything in that case.
                    delete this.samplePlotJSON.encoding.x.axis;
                }
            } else {
                this.samplePlotJSON.encoding.color.type = document.getElementById(
                    "colorScale"
                ).value;
            }
            this.remakeSamplePlot();
        }

        updateSamplePlotBoxplot() {
            // We only bother changing up anything if the sample plot x-axis
            // is currently categorical.
            if (this.samplePlotJSON.encoding.x.type === "nominal") {
                if (document.getElementById("boxplotCheckbox").checked) {
                    this.changeSamplePlotToBoxplot(true);
                } else {
                    this.changeSamplePlotFromBoxplot(true);
                }
            }
        }

        static changeColorElementEnabled(enable) {
            // List of DOM elements that have to do with the color controls. We
            // disable these when in "boxplot mode" because Vega-Lite gets
            // grumpy when you try to apply colors to a boxplot that have
            // different granularity than the boxplot's current x-axis.
            // (It does the same thing with tooltips.)
            var colorEles = ["colorField", "colorScale"];
            var e;
            if (enable) {
                for (e = 0; e < colorEles.length; e++) {
                    document.getElementById(colorEles[e]).disabled = false;
                }
            } else {
                for (e = 0; e < colorEles.length; e++) {
                    document.getElementById(colorEles[e]).disabled = true;
                }
            }
        }

        /* Changes the sample plot JSON and DOM elements to get ready for
         * switching to "boxplot mode." If callRemakeSamplePlot is truthy, this
         * will actually call this.remakeSamplePlot(); otherwise, this won't do
         * anything.
         *
         * callRemakeSamplePlot should be false if this is called in the
         * middle of remaking the sample plot, anyway -- e.g. if the user
         * switched the x-axis scale type from quantitative to categorical, and
         * the "use boxplots" checkbox was already checked.
         *
         * callRemakeSamplePlot should be true if this is called as the only
         * update to the sample plot that's going to be made -- i.e. the user
         * was already using a categorical x-axis scale, and they just clicked
         * the "use boxplots" checkbox.
         */
        changeSamplePlotToBoxplot(callRemakeSamplePlot) {
            this.samplePlotJSON.mark.type = "boxplot";
            // Make the middle tick of the boxplot black. This makes boxes for
            // which only one sample is available show up on the white
            // background and light-gray axis.
            this.samplePlotJSON.mark.median = { color: "#000000" };
            RRVDisplay.changeColorElementEnabled(false);
            this.setColorForBoxplot();
            delete this.samplePlotJSON.encoding.tooltip;
            if (callRemakeSamplePlot) {
                this.remakeSamplePlot();
            }
        }

        /* Like changeSamplePlotToBoxplot(), but the other way around. This is
         * a bit simpler, since (as of writing) we have to do less to go back
         * to a normal circle mark from the boxplot mark.
         *
         * callRemakeSamplePlot works the same way as in
         * changeSamplePlotToBoxplot().
         */
        changeSamplePlotFromBoxplot(callRemakeSamplePlot) {
            this.samplePlotJSON.mark.type = "circle";
            delete this.samplePlotJSON.mark.median;
            RRVDisplay.changeColorElementEnabled(true);
            // No need to explicitly adjust color or tooltips here; tooltips
            // will be auto-added in updateSamplePlotTooltips() (since it will
            // detect that boxplot mode is off, and therefore try to add
            // tooltips), and color should have been kept up-to-date every time
            // the field was changed while boxplot mode was going on (as well
            // as at the start of boxplot mode), in setColorForBoxplot().
            if (callRemakeSamplePlot) {
                this.remakeSamplePlot();
            }
        }

        static identifyMetadataColumns(samplePlotSpec) {
            // Given a Vega-Lite sample plot specification, find all the metadata cols.
            // Just uses whatever the first available sample's keys are as a
            // reference. So, uh, if the input sample plot JSON has zero samples, this
            // will fail. (But that should have been caught in the python script.)
            var dataName = samplePlotSpec.data.name;
            var mdCols = Object.keys(samplePlotSpec.datasets[dataName][0]);
            if (mdCols.length > 0) {
                return mdCols;
            } else {
                throw new Error(
                    "No metadata columns identified. Something seems " +
                        "wrong with the sample plot JSON."
                );
            }
        }

        /* Checks if a sample ID is actually supported by the count data we
         * have. We do this by just looking at all the samples with count data
         * for a feature ID, and checking to make sure that the sample ID is
         * one of those.
         *
         * (This function makes the assumption that each feature will have the
         * same number of samples associated with it -- this is why we only
         * bother checking a single feature here. This is a safe assumption,
         * since we construct the feature count JSON from a BIOM table on the
         * python side of things.)
         */
        validateSampleID(sampleID) {
            if (this.feature_cts[this.feature_ids[0]][sampleID] === undefined) {
                throw new Error("Invalid sample ID: " + sampleID);
            }
        }

        /* Given a "row" of the sample plot's JSON for a sample, and given an array of
         * features, return the sum of the sample's abundances for those particular features.
         * TODO: add option to do log geometric means
         */
        sumAbundancesForSampleFeatures(sampleRow, features) {
            var sampleID = sampleRow["Sample ID"];
            this.validateSampleID(sampleID);
            var abundance = 0;
            for (var t = 0; t < features.length; t++) {
                abundance += this.feature_cts[features[t]][sampleID];
            }
            return abundance;
        }

        /* Use abundance data to compute the new log ratio ("balance") values of
         * log(high feature abundance) - log(low feature abundance) for a given sample.
         *
         * This particular function is for log ratios of two individual features that were
         * selected via the rank plot.
         */
        updateBalanceSingle(sampleRow) {
            var sampleID = sampleRow["Sample ID"];
            this.validateSampleID(sampleID);
            var topCt = this.feature_cts[this.newFeatureHigh][sampleID];
            var botCt = this.feature_cts[this.newFeatureLow][sampleID];
            return feature_computation.computeBalance(topCt, botCt);
        }

        /* Like updateBalanceSingle, but considers potentially many features in the
         * numerator and denominator of the log ratio. For log ratios generated
         * by textual queries.
         */
        updateBalanceMulti(sampleRow) {
            this.validateSampleID(sampleRow["Sample ID"]);
            // NOTE: For multiple features Virus/Staphylococcus:
            // test cases in comparison to first scatterplot in Jupyter
            // Notebook: 1517, 1302.
            var topCt = this.sumAbundancesForSampleFeatures(
                sampleRow,
                this.topFeatures
            );
            var botCt = this.sumAbundancesForSampleFeatures(
                sampleRow,
                this.botFeatures
            );
            return feature_computation.computeBalance(topCt, botCt);
        }

        /* From downloadDataURI() in the MetagenomeScope viewer interface
         * source code.
         */
        static downloadDataURI(filename, contentToDownload, isPlainText) {
            document.getElementById("downloadHelper").download = filename;
            if (isPlainText) {
                var data =
                    "data:text/plain;charset=utf-8;base64," +
                    window.btoa(contentToDownload);
                document.getElementById("downloadHelper").href = data;
            } else {
                document.getElementById(
                    "downloadHelper"
                ).href = contentToDownload;
            }
            document.getElementById("downloadHelper").click();
        }

        /* Calls RRVDisplay.downloadDataURI() on the result of
         * getSamplePlotData().
         */
        exportData() {
            var currMetadataField = this.samplePlotJSON.encoding.x.field;
            var tsv = this.getSamplePlotData(currMetadataField);
            if (tsv.length > 0) {
                RRVDisplay.downloadDataURI(
                    "rrv_sample_plot_data.tsv",
                    tsv,
                    true
                );
            }
            // Also I guess export feature IDs somehow.
            // TODO go through this.topFeatures and this.botFeatures; convert
            // from two arrays to a string, where each feature is separated by
            // a newline and the numerator feature list is followed by
            // "DENOMINATOR FEATURES\n" and then the denominator feature list.
            // Then I guess uh just save that to a .txt file?
        }

        /* Adds surrounding quotes if the string t contains any whitespace or
         * contains any double-quote characters (").
         *
         * If surrounding quotes are added, this will also "escape" any double
         * quote characters in t by converting each double quote to 2 double
         * quotes. e.g. abcd"ef"g --> "abcd""ef""g"
         *
         * This should make t adhere to the excel-tab dialect of python's csv
         * module, as discussed in the QIIME 2 documentation
         * (https://docs.qiime2.org/2019.1/tutorials/metadata/#tsv-dialect-and-parser)
         * and elaborated on in PEP 305
         * (https://www.python.org/dev/peps/pep-0305/).
         */
        static quoteTSVFieldIfNeeded(t) {
            if (typeof t === "string" && /\s|"/g.test(t)) {
                // If the first argument of .replace() is just a string, only
                // the first match will be changed. Using a regex with the g
                // flag fixes this; see
                // https://stackoverflow.com/a/10610408/10730311
                return '"' + t.replace(/"/g, '""') + '"';
            } else {
                return t;
            }
        }

        /* Exports data from the sample plot to a string that can be written to
         * a .tsv file for further analysis of these data.
         *
         * If no points have been "drawn" on the sample plot -- i.e. they all
         * have a rankratioviz_balance attribute of null, NaN, or undefined,
         * due to either no log ratio being selected or the current log ratio
         * being NaN for all samples -- then this just returns an empty string.
         */
        getSamplePlotData(currMetadataField) {
            var outputTSV = "Sample_ID\tLog_Ratio";
            var uniqueMetadata = true;
            if (
                currMetadataField !== "Sample ID" &&
                currMetadataField !== "rankratioviz_balance"
            ) {
                outputTSV +=
                    "\t" + RRVDisplay.quoteTSVFieldIfNeeded(currMetadataField);
            } else {
                uniqueMetadata = false;
            }
            var dataName = this.samplePlotJSON.data.name;
            // Get all of the data available to the sample plot
            var data = this.samplePlotView.data(dataName);
            var currBalance;
            var currSampleID;
            var currMetadataValue;
            var atLeastOnePointDrawn = false;
            for (var i = 0; i < data.length; i++) {
                currBalance = data[i].rankratioviz_balance;
                if (
                    !Number.isNaN(currBalance) &&
                    currBalance !== null &&
                    currBalance !== undefined
                ) {
                    atLeastOnePointDrawn = true;
                    currSampleID = RRVDisplay.quoteTSVFieldIfNeeded(
                        data[i]["Sample ID"]
                    );
                    // Use of regex .test() with \s per
                    // https://stackoverflow.com/a/1731200/10730311
                    outputTSV += "\n" + currSampleID + "\t" + currBalance;
                    if (uniqueMetadata) {
                        currMetadataValue = RRVDisplay.quoteTSVFieldIfNeeded(
                            data[i][currMetadataField]
                        );
                        outputTSV += "\t" + currMetadataValue;
                    }
                }
            }
            if (!atLeastOnePointDrawn) {
                return "";
            }
            return outputTSV;
        }

        static clearDiv(divID) {
            // From https://stackoverflow.com/a/3450726/10730311.
            // This way is apparently faster than just using
            // document.getElementById(divID).innerHTML = '' -- not that
            // performance really matters a ton here, but whatever.
            var element = document.getElementById(divID);
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }

        /* Selectively clears the effects of this rrv instance on the DOM.
         *
         * You should only call this with clearOtherStuff set to a truthy value
         * when you want to get rid of the entire current display. This won't
         * really "delete" the current RRVDisplay instance, but this should
         * make it feasible to create new RRVDisplay instances afterwards
         * without refreshing the page.
         */
        destroy(clearRankPlot, clearSamplePlot, clearOtherStuff) {
            if (clearRankPlot) {
                this.rankPlotView.finalize();
                RRVDisplay.clearDiv("rankPlot");
            }
            if (clearSamplePlot) {
                this.samplePlotView.finalize();
                RRVDisplay.clearDiv("samplePlot");
            }
            if (clearOtherStuff) {
                // Clear the "features text" displays
                this.updateFeaturesTextDisplays(false, true);
                // Clear the bindings of bound DOM elements
                for (
                    var i = 0;
                    i < this.elementsWithOnClickBindings.length;
                    i++
                ) {
                    document.getElementById(
                        this.elementsWithOnClickBindings[i]
                    ).onclick = undefined;
                }
                for (
                    var j = 0;
                    j < this.elementsWithOnChangeBindings.length;
                    j++
                ) {
                    document.getElementById(
                        this.elementsWithOnChangeBindings[j]
                    ).onchange = undefined;
                }
            }
        }
    }

    return { RRVDisplay: RRVDisplay };
});
