// Main page: [[User:SuperGrey/gadgets/Select-a-lot]]

(function() {
    const SelectALot = {
        HasGallery: false,

        /**
         * Initialization: add a menu item under the "Actions" portlet (p-cactions)
         */
        init: function() {
            // Only initialize when the category media container exists
            if (!$('#mw-category-media').length) {
                return;
            }

            mw.util.addPortletLink('p-cactions', '#', 'Select-a-lot', 'ca-selectalot', 'Run Select-a-lot tool');
            $('#ca-selectalot').on('click', function(e) {
                e.preventDefault();
                SelectALot.addCheckboxes();
                SelectALot.openWindow();
            });
            window.addEventListener('beforeunload', function(e) {
                if (SelectALot.hasSelection()) {
                    const message = 'You have selected items. Are you sure you want to leave?';
                    e.preventDefault();
                    e.returnValue = message;
                    return message;
                }
            });
        },

        /**
         * Add checkboxes to gallerytext or list items inside #mw-category-media
         */
        addCheckboxes: function() {
            // Determine if gallery structure exists
            SelectALot.HasGallery = $('#mw-category-media .gallery').length > 0;
            const selector = SelectALot.HasGallery
                ? '#mw-category-media .gallerytext'
                : '#mw-category-media li';

            $(selector).each(function() {
                const $item = $(this);
                if ($item.find('input.selectalot-checkbox').length) return;
                const $checkbox = $('<input>', {
                    type: 'checkbox',
                    class: 'selectalot-checkbox',
                    style: 'margin-right: 5px',
                    title: 'Select this item'
                });
                $item.prepend($checkbox);
                $checkbox.on('change', function() {
                    SelectALot.checkboxChanged($item, this.checked);
                });
            });
        },

        /**
         * Callback invoked when a checkbox is toggled
         */
        checkboxChanged: function($item, checked) {
            // Apply or clear highlight
            if (checked) {
                $item.css('background-color', '#fffae6');
            } else {
                $item.css('background-color', '');
            }
            if ($('#selectalot-window').is(':visible')) {
                SelectALot.updateList();
            }
        },

        /**
         * Check if any items are selected
         */
        hasSelection: function() {
            return $('.selectalot-checkbox:checked').length > 0;
        },

        /**
         * Clear all highlights
         */
        clearHighlights: function() {
            if (SelectALot.HasGallery) {
                $('#mw-category-media .gallerytext').css('background-color', '');
            } else {
                $('#mw-category-media li').css('background-color', '');
            }
        },

        /**
         * Show all checkboxes
         */
        showCheckboxes: function() {
            $('.selectalot-checkbox').show();
        },

        /**
         * Hide all checkboxes
         */
        hideCheckboxes: function() {
            $('.selectalot-checkbox').hide();
        },

        /**
         * Create the floating window if it doesn't exist
         */
        createWindow: function() {
            if ($('#selectalot-window').length) return;
            const $win = $('<div>', { id: 'selectalot-window', css: {
                    position: 'fixed', bottom: '10px', right: '10px', width: '300px', background: '#fff',
                    border: '1px solid #ccc','box-shadow': '0 0 5px rgba(0,0,0,0.3)','z-index': 1000,
                    padding: '10px','font-family': 'sans-serif',display: 'none'
                }});
            // Header
            const $header = $('<div>', { css: {'margin-bottom':'8px','font-weight':'bold'} });
            $header.append($('<span>').text('Select-a-lot'));
            const $close = $('<button>', { text: '×', css: { float: 'right', border: 'none', background: 'none', 'font-size': '16px', cursor: 'pointer' }, title: 'Close' })
                .on('click', () => SelectALot.closeWindow());
            $header.append($close);
            $win.append($header);

            // List
            const $list = $('<ul>', { class: 'selectalot-list', css: {'list-style':'disc', padding:'0 0 0 20px', margin:0, 'max-height':'200px', overflow:'auto'} });
            $win.append($list);

            // Controls
            const $controls = $('<div>', { css: {'margin-top':'8px','text-align':'right'} });
            const $clearBtn = $('<button>', { text: 'Clear Selection', css: {'margin-right':'5px', cursor:'pointer'} })
                .on('click', () => SelectALot.clearSelection());
            const $copyBtn = $('<button>', { text: 'Copy to Clipboard', css: {cursor:'pointer'} })
                .on('click', () => SelectALot.copyToClipboard());
            $controls.append($clearBtn, $copyBtn);
            $win.append($controls);

            $('body').append($win);
        },

        /**
         * Open the floating window
         */
        openWindow: function() {
            SelectALot.createWindow();
            SelectALot.showCheckboxes();
            SelectALot.applyAllHighlights();
            $('#selectalot-window').show();
            SelectALot.updateList();
        },

        /**
         * Close the floating window and clear UI
         */
        closeWindow: function() {
            $('#selectalot-window').hide();
            SelectALot.clearHighlights();
            SelectALot.hideCheckboxes();
        },

        /**
         * Re-apply highlights for checked items
         */
        applyAllHighlights: function() {
            $('.selectalot-checkbox').each(function() {
                const $item = SelectALot.HasGallery
                    ? $(this).closest('.gallerytext')
                    : $(this).closest('li');
                SelectALot.checkboxChanged($item, this.checked);
            });
        },

        /**
         * Update the list of selected file names or links
         */
        updateList: function() {
            const $list = $('#selectalot-window .selectalot-list').empty();
            $('.selectalot-checkbox:checked').each(function() {
                let href;
                if (SelectALot.HasGallery) {
                    href = $(this).closest('.gallerytext').find('a.galleryfilename').first().attr('href');
                } else {
                    href = $(this).closest('li').find('a').first().attr('href');
                }
                if (href) {
                    const filename = decodeURIComponent(href.replace(/.*\/wiki\/File:/, ''));
                    $list.append($('<li>').text(filename));
                }
            });
            if (!$list.children().length) {
                $list.append($('<li>').text('No items selected'));
            }
        },

        /**
         * Clear all selections and UI
         */
        clearSelection: function() {
            $('.selectalot-checkbox:checked').prop('checked', false);
            SelectALot.clearHighlights();
            SelectALot.updateList();
        },

        /**
         * Copy selected items to clipboard
         */
        copyToClipboard: function() {
            const items = [];
            $('.selectalot-checkbox:checked').each(function() {
                let href;
                if (SelectALot.HasGallery) {
                    href = $(this).closest('.gallerytext').find('a.galleryfilename').first().attr('href');
                } else {
                    href = $(this).closest('li').find('a').first().attr('href');
                }
                if (href) {
                    items.push(decodeURIComponent(href.replace(/.*\/wiki\/File:/, '')));
                }
            });
            const text = items.join('\n');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!')).catch(() => alert('Copy failed.'));
            } else {
                prompt('Copy to clipboard: Ctrl+C, Enter', text);
            }
        }
    };

    $(SelectALot.init);
})();
