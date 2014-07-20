﻿///<reference path="Scripts/typings/jquery/jquery.d.ts"/>
///<reference path="Scripts/typings/knockout/knockout.d.ts"/>
var VoteEntry = (function () {
    function VoteEntry() {
        this.totalVotes1Raw = ko.observable(0);
        this.totalVotes2Raw = ko.observable(0);
        this.totalVotesRaw = ko.observable(0);
        this.totalVotes1 = ko.observable("");
        this.percentageVotes1 = ko.observable("");
        this.totalVotes2 = ko.observable("");
        this.percentageVotes2 = ko.observable("");
        this.total = ko.observable("");
        this.label = ko.observable("");
        this.status1 = ko.observable("");
        this.status2 = ko.observable("");
    }
    return VoteEntry;
})();

var Pilpres2014 = (function () {
    function Pilpres2014() {
        var _this = this;
        var self = this;
        this.url = ko.observable("https://github.com/ht4n/Pilpres2014");
        this.provinces = ko.observableArray([]);
        this.totalVotes1 = ko.observable("");
        this.totalVotes2 = ko.observable("");
        this.percentageVotes1 = ko.observable("");
        this.percentageVotes2 = ko.observable("");
        this.status1 = ko.observable("");
        this.status2 = ko.observable("");
        this.totalVotes = ko.observable("");
        this.voteEntries = ko.observableArray([]);
        this.provinceVoteEntries = ko.observableArray([]);
        this.showProvinceDetails = ko.observable(false);

        this.baseFeedUrl = "https://github.com/ht4n/Pilpres2014/blob/master/KPU-Feeds-";
        this.historicalFeeds = ko.observableArray([]);
        this.selectedDataFeed = ko.observable(null);
        this.lastUpdatedTime = ko.observable("");

        this.query("feedsources.json", null, function (data, status) {
            console.log("response:" + status);
            if (status !== "success") {
                return;
            }

            var dataJson = JSON.parse(data);
            dataJson.forEach(function (entry) {
                self.historicalFeeds.push(entry);
            });

            // Sets the current feed as the first one
            var historicalFeedsLength = _this.historicalFeeds().length;
            var currentFeedItem = _this.historicalFeeds()[0];
            _this.selectedDataFeed(currentFeedItem);
            _this.lastUpdatedTime(_this.selectedDataFeed().datetime);

            _this.refresh(_this.selectedDataFeed().datetime);
        });

        this.toggleProvinceText = ko.observable("Show votes by province");
    }
    Pilpres2014.prototype.updateVoteByDate = function (data, event) {
        var vm = ko.contextFor(event.currentTarget);
        vm.$root.refresh(data.datetime);
    };

    Pilpres2014.prototype.toggleProvinceDetails = function () {
        if (this.showProvinceDetails()) {
            this.showProvinceDetails(false);
            this.toggleProvinceText("Show votes by province");
        } else {
            this.showProvinceDetails(true);
            this.toggleProvinceText("Hide votes by province");

            var self = this;
            var provinceCallback = function (data, status) {
                console.log("response:" + status);
                if (status !== "success") {
                    return;
                }

                var dataJson = JSON.parse(data);
                self.provinceVoteEntries.removeAll();
                dataJson.forEach(function (entry) {
                    var voteEntry = new VoteEntry();
                    voteEntry.totalVotes1Raw(parseInt(entry.PrabowoHattaVotes));
                    voteEntry.totalVotes2Raw(parseInt(entry.JokowiKallaVotes));
                    voteEntry.totalVotesRaw(parseInt(entry.Total));

                    voteEntry.totalVotes1(parseInt(entry.PrabowoHattaVotes).toLocaleString());
                    voteEntry.percentageVotes1(parseFloat(entry.PrabowoHattaPercentage).toFixed(2));
                    voteEntry.totalVotes2(parseInt(entry.JokowiKallaVotes).toLocaleString());
                    voteEntry.percentageVotes2(parseFloat(entry.JokowiKallaPercentage).toFixed(2));
                    voteEntry.total(parseInt(entry.Total).toLocaleString());
                    voteEntry.label(entry.Province);

                    self.provinceVoteEntries.push(voteEntry);
                });
            };

            this.query("KPU-Feeds-" + this.selectedDataFeed().datetime + "-province.json", null, provinceCallback);
        }
    };

    Pilpres2014.prototype.sortProvinceData = function (field) {
        var self = this;
        switch (field) {
            case 1:
                self.provinceVoteEntries.sort(function (a, b) {
                    return parseFloat(b.percentageVotes1()) - parseFloat(a.percentageVotes1());
                });
                break;
            case 2:
                self.provinceVoteEntries.sort(function (a, b) {
                    return parseFloat(b.percentageVotes2()) - parseFloat(a.percentageVotes2());
                });
                break;
            case 3:
                self.provinceVoteEntries.sort(function (a, b) {
                    return b.totalVotes1Raw() - a.totalVotes1Raw();
                });
                break;
            case 4:
                self.provinceVoteEntries.sort(function (a, b) {
                    return b.totalVotes2Raw() - a.totalVotes2Raw();
                });
                break;
            case 5:
                self.provinceVoteEntries.sort(function (a, b) {
                    return b.totalVotesRaw() - a.totalVotesRaw();
                });
                break;
        }
    };

    Pilpres2014.prototype.refresh = function (datetime) {
        var _this = this;
        var self = this;
        self.voteEntries.removeAll();

        var totalCallback = function (data, status) {
            var _this = this;
            console.log("response:" + status);
            if (status !== "success") {
                return;
            }

            var dataJson = JSON.parse(data);
            dataJson.forEach(function (entry) {
                var context = _this;
                var voteEntry = new VoteEntry();
                voteEntry.totalVotes1(parseInt(entry.PrabowoHattaVotes).toLocaleString());
                voteEntry.status1(parseFloat(entry.PrabowoHattaPercentage) > 50.0 ? "win" : "");
                voteEntry.percentageVotes1(parseFloat(entry.PrabowoHattaPercentage).toFixed(2) + "%");

                voteEntry.totalVotes2(parseInt(entry.JokowiKallaVotes).toLocaleString());
                voteEntry.status2(parseFloat(entry.JokowiKallaPercentage) > 50.0 ? "win" : "");
                voteEntry.percentageVotes2(parseFloat(entry.JokowiKallaPercentage).toFixed(2) + "%");

                voteEntry.total(entry.Total);
                voteEntry.label(context);

                self.voteEntries.push(voteEntry);
            });

            if (self.voteEntries().length > 0) {
                var firstEntry = self.voteEntries()[0];

                self.percentageVotes1(firstEntry.percentageVotes1());
                self.percentageVotes2(firstEntry.percentageVotes2());
                self.totalVotes1(firstEntry.totalVotes1());
                self.totalVotes2(firstEntry.totalVotes2());
                self.totalVotes(firstEntry.total());
                self.status1("bigScore " + firstEntry.status1());
                self.status2("bigScore " + firstEntry.status2());
            }
        };

        this.historicalFeeds().forEach(function (value) {
            _this.query("KPU-Feeds-" + value.datetime + "-total.json", value.datetime, totalCallback);
        });
    };

    Pilpres2014.prototype.query = function (url, context, callback, statusCallback) {
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'text',
            contentType: 'application/json',
            context: context,
            statusCode: statusCallback
        }).always(function (data, status, jqXHR) {
            if (callback) {
                callback.call(this, data, status, jqXHR);
            }
        });
    };
    return Pilpres2014;
})();

var pilpres2014ViewModel;

window.onload = function () {
    pilpres2014ViewModel = new Pilpres2014();
    ko.applyBindings(pilpres2014ViewModel);
};
//# sourceMappingURL=app.js.map
