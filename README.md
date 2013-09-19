instapull
=========
Plugin for jQuery users who want to pull Instagram photos according to tag and likes into a specified container.

Simple usage:

    $(function () {

        $("#elementtofill").instapull(
            { clientId: "<your instagram api client id>" // !required
            , likingBy: "<your instagram user id>"
            , filterOn: "<your desired instagram tag>"
            , sortedBy: "likes"
            , untilNow: "2013-10-01"
            , afterNow: "2013-09-01"
            , pageSize: 20
            , onWiring: function (oGrid) {
                    $("#restart").click(function () {
                        $("#result").html("");
                        oGrid.reset();
                        oGrid.fetch();

                        return false;
                    });

                    $("#next").click(function () {
                        oGrid.fetch();

                        return false;
                    });
                }
            , onAdding: function (oElem, oItem) {
                    oElem.append("<div class=\"thumb\"><img src=\"" + oItem.images.thumbnail.url + "\" alt=\"\" /></div>");
                }
                , onPaging: function (oElem) {
                    $("#wait").fadeIn();
                }
                , onFinish: function (oElem) {
                    $("#wait").fadeOut();
                }
                , onNoMore: function (oElem) {
                    $("#restart").fadeIn();
                }
            });

    });
