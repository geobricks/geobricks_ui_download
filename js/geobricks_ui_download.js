define(['jquery',
        'handlebars',
        'text!geobricks_ui_download/html/templates.hbs',
        'i18n!geobricks_ui_download/nls/translate',
        'select2',
        'bootstrap'], function ($, Handlebars, templates, translate) {

    'use strict';

    function DOWNLOAD() {

        this.CONFIG = {
            lang            :   'en',
            placeholder_id  :   'placeholder',
            url_datasources :   'http://localhost:5555/discovery/datasource/'
        };

    }

    /**
     * This is the entry method to configure the module.
     *
     * @param config Custom configuration in JSON format to extend the default settings.
     */
    DOWNLOAD.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang != null ? this.CONFIG.lang : 'en';

    };

    DOWNLOAD.prototype.render_main_structure = function(datasource_id) {

        /* Render the main structure. */
        var source = $(templates).filter('#main_structure').html();
        var template = Handlebars.compile(source);
        var dynamic_data = {
            title: translate.title,
            subtitle: translate.subtitle,
            filters: translate.filters,
            progress: translate.progress,
            datasources: translate.datasources,
            please_select: translate.please_select,
            download_selected_layers: translate.download_selected_layers
        };
        var html = template(dynamic_data);
        $('#' + this.CONFIG.placeholder_id).html(html);

        /* Store datasource selector. */
        this.CONFIG.datasource_selector = $('#datasource_selector');

        /* This. */
        var _this = this;

        /* Fill data source list and initialize Chosen. */
        $.ajax({

            type: 'GET',
            url: this.CONFIG.url_datasources,

            success: function (response) {

                /* Cast the response to JSON, if needed. */
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);

                /* Fill the drop-down. */
                var s = '';
                s += '<option value=""></option>';
                for (var i = 0 ; i < json.length ; i++) {
                    s += '<option value="' + json[i].title + '">';
                    s += json[i].title + ' - ' + json[i].description;
                    s += '</option>';
                }

                /* Trigger Select2. */
                _this.CONFIG.datasource_selector.html(s).select2();
                _this.CONFIG.datasource_selector.change(function() {
                    var data_source_id = $('#' + this.id + ' option:selected').val().toLowerCase();
                    _this.build_data_source_interface(data_source_id);
                });

                /* Build datasource panel. */
                if (datasource_id != undefined)
                    $('#datasource_selector').val(datasource_id.toUpperCase()).trigger('change')

            }

        });

    };

    DOWNLOAD.prototype.build_data_source_interface = function(data_source_id) {
        var _this = this;
        Backbone.history.navigate('/en/download/' + data_source_id, true);
        $('#dynamic_filters').empty();
        require(['GEOBRICKS_UI_DOWNLOAD_' + data_source_id.toUpperCase()], function (MODULE) {
            MODULE.init({
                lang: _this.CONFIG.lang,
                placeholder_id: 'dynamic_filters'
            });
            $('#download_button').click(function() {
                MODULE.download();
            });
        });
    };

    DOWNLOAD.prototype.add_countries_filter = function(prefix) {

        /* Render the filter structure. */
        var template = $(templates).filter('#filter_structure').html();
        var view = {
            filter_id: prefix + '_filter',
            filter_label: translate[prefix],
            please_select: translate.please_select
        };
        var render = Mustache.render(template, view);
        $('#dynamic_filters').append(render);

        /* Fill data source list and initialize Chosen. */
        $.ajax({

            type: 'GET',
            url: 'http://localhost:5555/browse/modis/countries/',

            success: function (response) {

                /* Cast the response to JSON, if needed. */
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);

                var countries = json.sort(function(a, b) {
                    return a.gaul_label > b.gaul_label;
                });

                /* Fill the drop-down. */
                var s = '';
                s += '<option value=""></option>';
                for (var i = 0 ; i < countries.length ; i++) {
                    s += '<option ';
                    s += 'data-gaul="' + countries[i].gaul_code + '" ';
                    s += 'data-iso2="' + countries[i].iso2_code + '" ';
                    s += 'data-iso3="' + countries[i].iso3_code + '" ';
                    s += '>';
                    s += countries[i].gaul_label;
                    s += '</option>';
                }

                /* Trigger Chosen. */
                $('#' + prefix + '_filter').html(s);
                $('#' + prefix + '_filter').select2({disable_search_threshold: 10});

            }

        });

    };

    return DOWNLOAD;

});
