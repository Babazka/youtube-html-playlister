function MyYoutubePlayer() {
    var that = this;
    this.playlist_collection = [];
    this.now_playing_list = [];
    this.now_playing_video_id = '';
    this.current_playlist = '';

    this.undo_context = null;


    this.localSave = function() {
        this.undo_context = localStorage.getItem('my_youtube_data_context');
        var context = {
            'collection': this.playlist_collection,
            'now_playing_list': this.now_playing_list
        };
        var dump = JSON.stringify(context);
        localStorage.setItem('my_youtube_data_context', dump);
    };
    this.localLoad = function() {
        var dump = localStorage.getItem('my_youtube_data_context');
        if (!!dump) {
            var context = JSON.parse(dump);
            this.playlist_collection = context.collection;
            this.now_playing_list = context.now_playing_list;
        }
        this.updateView();
    };
    this.undoChanges = function() {
        var dump = this.undo_context;
        if (!!dump) {
            var context = JSON.parse(dump);
            this.playlist_collection = context.collection;
            this.now_playing_list = context.now_playing_list;
            this.localSave();
        } else {
            this.alert('Cannot undo further');
            return;
        }
        this.updateView();
    };

    this.reorderVideoList = function(list, id_order) {
        var dict = {};
        while (list.length > 0) {
            var video = list.pop();
            dict[video.id] = video;
        }
        for (var i = 0; i < id_order.length; i++) {
            var video = dict[id_order[i]];
            list.push(video);
        }
    };

    this.createPlaylist = function(title, videos) {
        if (!title) {
            that.alert('Cannot create playlist without a title');
            return false;
        }
        for (var i = 0; i < this.playlist_collection.length; i++) {
            if (this.playlist_collection.title == title) {
                that.alert('Playlist with this title already exists');
                return false;
            }
        }
        var new_videos = [];
        for (var i = 0; i < videos.length; i++) {
            new_videos.push(videos[i]);
        }
        var playlist = {
            'title': title,
            'videos': new_videos
        };
        this.playlist_collection.push(playlist);
        this.current_playlist = title;
        this.localSave();
        this.updateView();
    };

    this.getCurrentPlaylist = function() {
        for (var i = 0; i < this.playlist_collection.length; i++) {
            var playlist = this.playlist_collection[i];
            if (playlist.title == this.current_playlist) {
                return playlist;
            }
        }
    };

    this.deleteCurrentPlaylist = function() {
        if (this.playlist_collection.length <= 1) {
            this.alert('Cannot delete last playlist');
            return;
        }
        var new_collection = [];
        for (var i = 0; i < this.playlist_collection.length; i++) {
            var playlist = this.playlist_collection[i];
            if (playlist.title != this.current_playlist) {
                new_collection.push(playlist);
            }
        };
        this.playlist_collection = new_collection;
        this.current_playlist = new_collection[0].title;
        this.localSave();
        this.updateView();
    };

    this.playNowPlaying = function() {
        if (this.now_playing_list.length == 0) {
            return;
        }
        this.now_playing_video_id = this.now_playing_list[0].id;
        var selected_id = $('input[name="now_playing"]:checked').val();
        if (!!selected_id) {
            this.now_playing_video_id = selected_id;
        } else {
            $('input.now_playing_radio[value="' + this.now_playing_video_id + '"]').attr('checked', 'checked');
        }
        window.ytplayer.loadVideoById(this.now_playing_video_id, 0);
    };

    this.getNextVideo = function() {
        var mode = ($('#rd_mode_list').is(':checked')) ? 'list' : 'loop';
        for (var i = 0; i < this.now_playing_list.length; i++) {
            var el_id = '#now_video_' + i;
            if ($(el_id).is(':checked')) {
                var j;
                if (mode == 'loop') {
                    j = i;
                } else {
                    if (this.now_playing_list[i].id == this.now_playing_video_id) {
                        j = (i + 1) % this.now_playing_list.length;
                    } else {
                        j = i;
                    }
                }
                this.now_playing_video_id = this.now_playing_list[j].id;
                var new_el_id = '#now_video_' + j;
                $(new_el_id).attr('checked', 'checked');
                return this.now_playing_video_id;
            }
        }
    };

    this.getCurrentPlaylistVideo = function(video_id) {
        var playlist = this.getCurrentPlaylist();
        for (var i = 0; i < playlist.videos.length; i++) {
            if (playlist.videos[i].id == video_id) {
                return playlist.videos[i];
            }
        }
    };

    this.getNowPlayingVideo = function(video_id) {
        var list = this.now_playing_list;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id == video_id) {
                return list[i];
            }
        }
    };

    this.removeFromNowPlaying = function(video_id) {
        var new_now_playing = [];
        for (var i = 0; i < this.now_playing_list.length; i++) {
            if (this.now_playing_list[i].id == video_id) {
                continue;
            }
            new_now_playing.push(this.now_playing_list[i]);
        }
        this.now_playing_list = new_now_playing;
        this.localSave();
        this.updateView();
    };

    this.removeFromCurrentPlaylist = function(video_id) {
        var new_list = [];
        var playlist = this.getCurrentPlaylist();
        for (var i = 0; i < playlist.videos.length; i++) {
            if (playlist.videos[i].id == video_id) {
                continue;
            }
            new_list.push(playlist.videos[i]);
        }
        playlist.videos = new_list;
        this.localSave();
        this.updateView();
    };

    this.addToCurrentPlaylist = function(video) {
        if (!video) {
            return;
        }
        var playlist = this.getCurrentPlaylist();
        for (var i = 0; i < playlist.videos.length; i++) {
            if (playlist.videos[i].id == video.id) {
                that.alert('This video is already in the playlist');
                return false;
            }
        }
        playlist.videos.push(video);
        this.localSave();
        this.updateView();
    };

    this.appendToCurrentPlaylist = function(list) {
        if (!list) {
            return;
        }
        var playlist = this.getCurrentPlaylist();
        var playlist_length = playlist.videos.length;
        for (var j = 0; j < list.length; j++) {
            var video = list[j];
            for (var i = 0; i < playlist_length; i++) {
                if (playlist.videos[i].id == video.id) {
                    that.alert('This video is already in the playlist');
                    return false;
                }
            }
            playlist.videos.push(video);
        }
        this.localSave();
        this.updateView();
    };

    this.playlistToNowPlaying = function() {
        var now_playing_length = this.now_playing_list.length;
        var playlist = this.getCurrentPlaylist();

        for (var i = 0; i < playlist.videos.length; i++) {
            var video = playlist.videos[i];

            var existing_index = null;
            for (var j = 0; j < now_playing_length; j++) {
                if (video.id == this.now_playing_list[j].id) {
                    existing_index = j;
                    break;
                }
            }
            if (existing_index !== null) {
                continue;
            }
            this.now_playing_list.push(video);
        }
        this.localSave();
        this.updateView();
    };

    this.addToNowPlaying = function(video) {
        if (!video) {
            return;
        }
        for (var i = 0; i < this.now_playing_list.length; i++) {
            if (this.now_playing_list[i].id == video.id) {
                that.alert('This video is already in Now Playing');
                return false;
            }
        }
        this.now_playing_list.push(video);
        this.localSave();
        this.updateView();
    };

    this.alert = function(text) {
        var el = $('#alert_div');
        el.removeClass('okay');
        el.addClass('warning');
        el.text(text);
    };
    this.clearAlert = function(text) {
        var el = $('#alert_div');
        el.removeClass('warning');
        el.addClass('okay');
        el.text('Everything is OK');
    };

    this.updateView = function() {
        this.clearAlert();
        if (this.playlist_collection.length == 0) {
            this.createPlaylist('Misc', []);
        }
        if (!this.current_playlist) {
            this.current_playlist = this.playlist_collection[0].title;
        }

        /* displaying playlist collection */
        var pc_el = $('#playlist_collection');
        var html = '';

        var selected_playlist = null;

        for (var i = 0; i < this.playlist_collection.length; i++) {
            var playlist = this.playlist_collection[i];
            var id = "plt_" + i;
            var checked = '';
            if (playlist.title == this.current_playlist) {
                checked = 'checked';
                selected_playlist = playlist;
            }
            var el = '<label class="collection-item" for="' + id + '">';
            el += '<input type="radio" group="p_collection" name="p_collection" value="' +
                playlist.title + '" id="' + id +'" ' + checked + '>';
            el += playlist.title +
                ' (' + playlist.videos.length + ')</label><br/>';
            html += el;
        }
        pc_el.html(html);

        /* displaying playlist contents */
        pc_el = $('#playlist_contents');
        html = '';

        for (var i = 0; i < selected_playlist.videos.length; i++) {
            var video = selected_playlist.videos[i];
            var id = "plt_video_" + i;
            var checked = '';
            var el = '<div><label class="playlist-item" data-video_id="' + video.id + '" for="' + id + '">';
            el += '<input type="radio" group="p_playlist" name="playlist" value="' +
                video.id + '" id="' + id +'" ' + checked + '>';
            el += '<a href="#" title="Rename track" data-video_id="' + video.id + '" class="jsa a-rename-track">R</a> '
            el += '<a href="#" title="Delete track" data-video_id="' + video.id + '" class="jsa a-remove-track">X</a> '
            el += video.title + '</label></div>';
            html += el;
        }
        pc_el.html(html);

        /* displaying now playing */
        pc_el = $('#now_playing');
        html = '';

        for (var i = 0; i < this.now_playing_list.length; i++) {
            var video = this.now_playing_list[i];
            var id = "now_video_" + i;
            var checked = '';
            if (video.id == this.now_playing_video_id) {
                checked = 'checked';
            }
            var el = '<div><label class="now-playing-item" data-video_id="' + video.id + '" for="' + id + '">';
            el += '<input type="radio" class="now_playing_radio" group="p_now_playing" name="now_playing" value="' +
                video.id + '" id="' + id +'" ' + checked + '>';
            el += '<a href="#" title="Remove track" data-video_id="' + video.id + '" class="jsa a-remove-from-now-playing">X</a> '
            el += '<a href="#" title="Add to current playlist" data-video_id="' + video.id + '" class="jsa a-from-now-playing-to-current-playlist">P</a> '
            el += video.title + '</label></div>';
            html += el;
        }
        pc_el.html(html);
    };

    this.parseUrlForVideoId = function(url) {
        // https://www.youtube.com/watch?v=lPM2NLRdtOg&list=PL7C183EA1B833B690
        var match = /\?v=([^&]+)/.exec(url);
        if (!match || match.length < 2) {
            return null;
        }
        return match[1];
    };

    this.parseUrlForPlaylistId = function(url) {
        // https://www.youtube.com/watch?v=lPM2NLRdtOg&list=PL7C183EA1B833B690
        var match = /[\?&]list=([^&]+)/.exec(url);
        if (!match || match.length < 2) {
            return null;
        }
        return match[1];
    };

    this.importVideoByUrl = function(url) {
        var video_id = this.parseUrlForVideoId(url);
        if (!video_id) {
            that.alert('URL does not look like YouTube video url');
            return;
        }
        $.get("https://gdata.youtube.com/feeds/api/videos/" + video_id + "?v=2&alt=json", function(data) {
            var video = {
                'id': video_id,
                'title': data['entry']['title']['$t']
            };
            that.addToCurrentPlaylist(video);
            that.addToNowPlaying(video);
        });
    };

    this.importPlaylistByUrl = function(url, offset) {
        var page_offset = offset || 1;
        var per_page = 50;
        var playlist_id = this.parseUrlForPlaylistId(url);
        if (!playlist_id) {
            that.alert('URL does not seem to contain YouTube playlist id');
            return;
        }
        $.get("https://gdata.youtube.com/feeds/api/playlists/" + playlist_id + "?v=2&alt=json&start-index=" + page_offset + "&max-results=" + per_page, function(data) {
            var playlist = {
                'title': data['feed']['title']['$t'],
                'videos': []
            };
            var total = data['feed']['openSearch$totalResults']['$t'];
            for (var i = 0; i < data['feed']['entry'].length; i++) {
                var entry = data['feed']['entry'][i];
                var video_id = that.parseUrlForVideoId(entry['link'][0]['href']);
                if (!video_id) {
                    console.log('cannot extract video_id from this thing:');
                    console.log(entry);
                    continue;
                }
                var video = {
                    'id': video_id,
                    'title': entry['title']['$t']
                };
                playlist.videos.push(video);
            }

            if (total <= per_page) {
                that.createPlaylist(playlist.title, playlist.videos);
            } else {
                if (page_offset == 1) {
                    that.createPlaylist(playlist.title, playlist.videos);
                } else {
                    that.appendToCurrentPlaylist(playlist.videos);
                }
                if (total >= page_offset + per_page - 1) {
                    that.alert('Loading next page of API data with offset ' + (page_offset + per_page) + '...');
                    that.importPlaylistByUrl(url, page_offset + per_page);
                }
            }
        });
    };

    this.bindHandlers = function() {
        $('#do_import_video_by_url').click(function(e) {
            var url = $('#import_video_by_url_input').val();
            that.importVideoByUrl(url);
            return false;
        });
        $('#do_import_playlist_by_url').click(function(e) {
            var url = $('#import_playlist_by_url_input').val();
            that.importPlaylistByUrl(url);
            return false;
        });
        $('#refresh_view_btn').click(function() {
            that.updateView();
        });
        $('#clear_now_playing').click(function() {
            that.now_playing_list = [];
            that.localSave();
            that.updateView();
        });
        $('#playlist_to_now_playing').click(function() {
            that.playlistToNowPlaying();
        });
        $('#play_now_playing').click(function() {
            that.playNowPlaying();
        });
        $('#undo').click(function() {
            that.undoChanges();
        });
        $('#playlist_collection').on('click', '.collection-item', function() {
            var selected_playlist = $('.collection-item input[type="radio"]:checked').val();
            that.current_playlist = selected_playlist;
            that.updateView();
        });
        $('#playlist_contents').on('click', '.playlist-item', function() {
            var selected_video_id = $('.playlist-item input[type="radio"]:checked').val();
            var video = that.getCurrentPlaylistVideo(selected_video_id);
            that.addToNowPlaying(video);
            that.updateView();
        });
        $('#playlist_contents').on('click', '.a-rename-track', function() {
            var selected_video_id = $(this).data('video_id');
            var video = that.getCurrentPlaylistVideo(selected_video_id);
            video.title = window.prompt('Rename track', video.title) || video.title;
            that.localSave();
            that.updateView();
            return false;
        });
        $('#playlist_contents').on('click', '.a-remove-track', function() {
            var selected_video_id = $(this).data('video_id');
            that.removeFromCurrentPlaylist(selected_video_id);
            return false;
        });
        $('#now_playing').on('dblclick', '.now-playing-item', function() {
            that.playNowPlaying();
        });
        $('#now_playing').on('click', '.a-remove-from-now-playing', function() {
            var selected_video_id = $(this).data('video_id');
            that.removeFromNowPlaying(selected_video_id);
            return false;
        });
        $('#now_playing').on('click', '.a-from-now-playing-to-current-playlist', function() {
            var selected_video_id = $(this).data('video_id');
            var video = that.getNowPlayingVideo(selected_video_id);
            that.addToCurrentPlaylist(video);
            return false;
        });
        $('#now_playing').sortable({
            stop: function() {
                var new_id_order = [];
                $('#now_playing label').each(function(i, el) {
                    var video_id = $(el).data('video_id');
                    new_id_order.push(video_id);
                });
                that.reorderVideoList(that.now_playing_list, new_id_order);
                that.localSave();
                that.updateView();
            }
        });
        $('#now_playing').disableSelection();

        $('#playlist_contents').sortable({
            stop: function() {
                var new_id_order = [];
                $('#playlist_contents label').each(function(i, el) {
                    var video_id = $(el).data('video_id');
                    new_id_order.push(video_id);
                });
                var playlist = that.getCurrentPlaylist();
                that.reorderVideoList(playlist.videos, new_id_order);
                that.localSave();
                that.updateView();
            }
        });
        $('#playlist_contents').disableSelection();

        $('#del_current_playlist').click(function() {
            that.deleteCurrentPlaylist();
            return false;
        });
        $('#add_playlist').click(function() {
            var title = window.prompt('Create playlist', 'New playlist');
            if (!title) {
                return;
            }
            that.createPlaylist(title, []);
            return false;
        });
        $('#save_now_playing_as').click(function() {
            var title = window.prompt('Save Now playing list as', 'New playlist');
            if (!title) {
                return;
            }
            that.createPlaylist(title, that.now_playing_list);
            return false;
        });
    };

    this.bindHandlers();
    this.localLoad();
}