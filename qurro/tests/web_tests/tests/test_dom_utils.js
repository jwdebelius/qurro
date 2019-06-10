define(["dom_utils", "mocha", "chai"], function(dom_utils, mocha, chai) {
    describe("Various general DOM utilities", function() {
        var getChildValuesFromSelect = function(selectID) {
            var ele = document.getElementById(selectID);
            var outputValues = [];
            for (var i = 0; i < ele.children.length; i++) {
                outputValues.push(ele.children[i].value);
            }
            return outputValues;
        };
        var assertSelected = function(selectID, expectedSelectedValue) {
            var ele = document.getElementById(selectID);
            for (var i = 0; i < ele.children.length; i++) {
                if (ele.children[i].value === expectedSelectedValue) {
                    chai.assert.isTrue(ele.children[i].selected);
                } else {
                    chai.assert.isFalse(ele.children[i].selected);
                }
            }
        };
        describe("Populating a <select> element with options", function() {
            var selectID = "qurro_select_test";
            it("Works properly in the basic case", function() {
                var vals = ["Thing 1", "Thing 2", "asdf"];
                dom_utils.populateSelect(selectID, vals, "asdf");
                chai.assert.sameMembers(
                    getChildValuesFromSelect(selectID),
                    vals
                );
                assertSelected(selectID, "asdf");
            });
            it("Clears the option list when called on an already-populated <select>", function() {
                // We shouldn't see stuff from the previous test (e.g. "Thing 1",
                // "asdf") in the select's options
                var vals = ["Thing 3", "Thing 2"];
                dom_utils.populateSelect(selectID, vals, "Thing 2");
                chai.assert.sameMembers(
                    getChildValuesFromSelect(selectID),
                    vals
                );
                assertSelected(selectID, "Thing 2");
            });
            it("Works properly with only one option", function() {
                var vals = ["lonely string"];
                dom_utils.populateSelect(selectID, vals, "lonely string");
                chai.assert.sameMembers(
                    getChildValuesFromSelect(selectID),
                    vals
                );
                assertSelected(selectID, "lonely string");
            });
            it("Throws an error when passed an empty list", function() {
                chai.assert.throws(function() {
                    dom_utils.populateSelect(selectID, [], "I'm irrelevant!");
                });
            });
        });

        var assertEnabled = function(selectID, isEnabled) {
            var ele = document.getElementById(selectID);
            if (!isEnabled) {
                chai.assert.isTrue(ele.disabled);
            } else {
                chai.assert.isFalse(ele.disabled);
            }
        };

        describe("Changing the enabled status of an element", function() {
            it("Properly disables elements", function() {
                dom_utils.changeElementsEnabled(
                    ["qurro_enabled_test", "qurro_enabled_test2"],
                    false
                );
                assertEnabled("qurro_enabled_test", false);
                assertEnabled("qurro_enabled_test2", false);
            });
            it("Properly enables elements", function() {
                dom_utils.changeElementsEnabled(
                    ["qurro_enabled_test", "qurro_enabled_test2"],
                    true
                );
                assertEnabled("qurro_enabled_test", true);
                assertEnabled("qurro_enabled_test2", true);
            });
        });

        describe("Clearing children of an element", function() {
            it("Works properly on nested elements", function() {
                var currID = "qurro_cleardiv_test";
                dom_utils.clearDiv(currID);
                chai.assert.isEmpty(document.getElementById(currID).children);
                var descendantIDs = [
                    "child",
                    "grandchild",
                    "child2",
                    "grandchild2",
                    "greatgrandchild"
                ];
                for (var c = 0; c < descendantIDs.length; c++) {
                    chai.assert.notExists(
                        document.getElementById(descendantIDs[c])
                    );
                }
            });
            it("Doesn't do anything on empty elements", function() {
                var currID = "qurro_cleardiv_emptyelement";
                dom_utils.clearDiv(currID);
                var ele = document.getElementById(currID);
                chai.assert.exists(ele);
                // Check that it didn't delete the top-level attributes of the
                // element
                chai.assert.equal(ele.getAttribute("sillyparam"), "hi!");
                // And it shouldn't *add* stuff to the div...
                chai.assert.isEmpty(ele.children);
            });
        });

        describe("Setting onchange and onclick element bindings", function() {
            // Silly little test functions
            function give4() {
                return 4;
            }
            function give8() {
                return 8;
            }
            it("Properly sets the onchange attribute", function() {
                var eleList = dom_utils.setUpDOMBindings(
                    { qurro_bindingtest1: give4 },
                    "onchange"
                );
                // Apparently you can just sorta call onchange() directly. See
                // https://stackoverflow.com/a/2856602/10730311.
                chai.assert.equal(
                    document.getElementById(eleList[0]).onchange(),
                    4
                );
            });
            it("Properly sets the onclick attribute", function() {
                var eleList = dom_utils.setUpDOMBindings(
                    { qurro_bindingtest2: give4 },
                    "onclick"
                );
                chai.assert.equal(
                    document.getElementById(eleList[0]).onclick(),
                    4
                );
            });
            it("Works with multiple elements at once", function() {
                var eleList = dom_utils.setUpDOMBindings(
                    { qurro_bindingtest1: give8, qurro_bindingtest3: give4 },
                    "onchange"
                );
                for (var i = 0; i < eleList.length; i++) {
                    if (eleList[i] === "qurro_bindingtest1") {
                        chai.assert.equal(
                            document.getElementById(eleList[i]).onchange(),
                            8
                        );
                    } else {
                        chai.assert.equal(
                            document.getElementById(eleList[i]).onchange(),
                            4
                        );
                    }
                }
            });
        });
        describe("Informing the user re: sample dropping statistics", function() {
            describe('Updating the "main" samples-shown div', function() {
                var htmlSuffix = "</strong> currently shown.";
                it("Works properly with normal inputs", function() {
                    dom_utils.updateMainSampleShownDiv(
                        { a: [1, 2, 3], b: [2, 3, 4, 5] },
                        15
                    );
                    chai.assert.equal(
                        document.getElementById("mainSamplesDroppedDiv")
                            .innerHTML,
                        "<strong>10 / 15 samples (66.67%)" + htmlSuffix
                    );
                    dom_utils.updateMainSampleShownDiv(
                        { a: [1, 2, 3], b: [4, 5] },
                        5
                    );
                    chai.assert.equal(
                        document.getElementById("mainSamplesDroppedDiv")
                            .innerHTML,
                        "<strong>0 / 5 samples (0.00%)" + htmlSuffix
                    );
                    dom_utils.updateMainSampleShownDiv({}, 13);
                    chai.assert.equal(
                        document.getElementById("mainSamplesDroppedDiv")
                            .innerHTML,
                        "<strong>13 / 13 samples (100.00%)" + htmlSuffix
                    );
                });

                it("Throws an error if totalSampleCount is 0", function() {
                    chai.assert.throws(function() {
                        dom_utils.updateMainSampleShownDiv({ a: [1, 2, 3] }, 0);
                    });
                });

                it("Throws an error if droppedSampleCount > totalSampleCount", function() {
                    chai.assert.throws(function() {
                        dom_utils.updateMainSampleShownDiv({ a: [1, 2, 3] }, 2);
                    });
                });

                describe("Computing the size of a union of arrays", function() {
                    it("Works properly with normal inputs", function() {
                        chai.assert.equal(
                            dom_utils.unionSize({
                                a: [1, 2, 3],
                                b: [2, 3, 4, 5]
                            }),
                            5
                        );
                        chai.assert.equal(
                            dom_utils.unionSize({ a: [1, 2, 3], b: [4, 5] }),
                            5
                        );
                        chai.assert.equal(
                            dom_utils.unionSize({
                                a: [1, 2],
                                b: [2, 3, 4, 5],
                                c: [6]
                            }),
                            6
                        );
                        chai.assert.equal(
                            dom_utils.unionSize({
                                a: ["Sample 1", "Sample 2"],
                                b: ["Sample 2", "Sample 3"],
                                c: ["Sample 1"]
                            }),
                            3
                        );
                    });
                    it("Works properly with empty list(s)", function() {
                        chai.assert.equal(
                            dom_utils.unionSize({ a: [], b: [], c: [6] }),
                            1
                        );
                        chai.assert.equal(
                            dom_utils.unionSize({
                                a: ["Sample 1"],
                                b: [],
                                c: ["Sample 2"]
                            }),
                            2
                        );
                        chai.assert.equal(
                            dom_utils.unionSize({ a: [], b: [], c: [] }),
                            0
                        );
                    });
                    it("Works properly with an empty input mapping", function() {
                        chai.assert.equal(dom_utils.unionSize({}), 0);
                    });
                });
            });
        });
    });
});
