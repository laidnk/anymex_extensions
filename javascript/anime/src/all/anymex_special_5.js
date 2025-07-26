const mangayomiSources = [{
    "name": "Anymex Special #5",
    "lang": "all",
    "baseUrl": "https://www.miruro.tv",
    "apiUrl": "",
    "iconUrl": "https://raw.githubusercontent.com/RyanYuuki/AnymeX/main/assets/images/logo.png",
    "typeSource": "multi",
    "itemType": 1,
    "version": "0.0.2",
    "pkgPath": "anime/src/all/anymex_special_5.js"
}];

class DefaultExtension extends MProvider {

    constructor() {
        super();
        this.client = new Client();
    }

    getPreference(key) {
        const preferences = new SharedPreferences();
        return preferences.get(key);
    }

    getHeaders(url) {
        return {
            Referer: "https://www.miruro.tv/",
            Origin: "https://www.miruro.tv"
        };
    }

    async getPopular(page) {
        throw new Error("getPopular not implemented");
    }

    get supportsLatest() {
        throw new Error("supportsLatest not implemented");
    }

    async getLatestUpdates(page) {
        throw new Error("getLatestUpdates not implemented");
    }

    async search(query, page, filters) {
        const url = `https://www.miruro.to/api/search/browse?search=${query}&page=1&perPage=15&type=ANIME&sort=SEARCH_MATCH`;
        const res = await this.client.get(url);

        const data = JSON.parse(res.body);
        const results = [];

        for (const result of data) {
            results.push({
                name: result.title.english ?? result.title.romaji ?? result.title.native,
                imageUrl: result.coverImage?.medium ?? '',
                link: JSON.stringify({
                    id: result.idMal,
                    title: result.title.english,
                    ongoing: result.status != "FINISHED"
                })
            });
        }

        return {
            list: results,
            hasNextPage: false
        };
    }

    async getDetail(url) {
        try {
            const { id, title, ongoing } = JSON.parse(url);
            const apiUrl = `https://www.miruro.to/api/episodes?malId=${id}&ongoing=${ongoing}`;

            const res = await this.client.get(apiUrl);
            const data = JSON.parse(res.body);

            // Safely extract provider data with fallbacks
            const providers = data.MAPPINGS?.providers || {};
            
            // Get provider IDs safely with null checks
            const animeKaiId = providers.ANIMEKAI?.provider_id?.[0] || null;
            const animePaheId = providers.ANIMEPAHE?.provider_id?.[0] || null;
            const zoroId = providers.ZORO?.provider_id?.[0] || null;

            // Get total episodes from available providers with fallbacks
            let totalEpisodes = 0;
            
            if (animeKaiId && data.ANIMEKAI?.[animeKaiId]?.episodeList?.totalEpisodes) {
                totalEpisodes = data.ANIMEKAI[animeKaiId].episodeList.totalEpisodes;
            } else if (animePaheId && data.ANIMEPAHE?.[animePaheId]?.episodeList?.length) {
                totalEpisodes = data.ANIMEPAHE[animePaheId].episodeList.length;
            } else if (zoroId && data.ZORO?.[zoroId]?.episodeList?.totalEpisodes) {
                totalEpisodes = data.ZORO[zoroId].episodeList.totalEpisodes;
            }

            const episodeList = [];

            for (let i = 1; i <= Number(totalEpisodes); i++) {
                let animeKaiEpId = null;
                let animePaheEpId = null;
                let zoroEpId = null;
                let name = 'Episode ' + i;

                // Safely get episode IDs for each provider
                try {
                    if (animeKaiId && data.ANIMEKAI?.[animeKaiId]?.episodeList?.episodes?.[i - 1]) {
                        animeKaiEpId = data.ANIMEKAI[animeKaiId].episodeList.episodes[i - 1].id;
                        // Try to get episode title
                        if (data.ANIMEKAI[animeKaiId].episodeList.episodes[i - 1].title) {
                            name = `EP ${i}: ${data.ANIMEKAI[animeKaiId].episodeList.episodes[i - 1].title}`;
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to get AnimeKai episode ${i}:`, e);
                }

                try {
                    if (animePaheId) {
                        animePaheEpId = `${animePaheId}/ep-${i}`;
                    }
                } catch (e) {
                    console.warn(`Failed to get AnimePahe episode ${i}:`, e);
                }

                try {
                    if (zoroId && data.ZORO?.[zoroId]?.episodeList?.episodes?.[i - 1]) {
                        zoroEpId = data.ZORO[zoroId].episodeList.episodes[i - 1].id;
                    }
                } catch (e) {
                    console.warn(`Failed to get Zoro episode ${i}:`, e);
                }

                const url = JSON.stringify({
                    animeKaiEpId,
                    animePaheEpId,
                    zoroEpId
                });

                episodeList.push({
                    name,
                    url
                });
            }

            return {
                name: title,
                chapters: episodeList.reverse()
            };

        } catch (error) {
            console.error('Error in getDetail:', error);
            // Return basic structure even if there's an error
            const { title } = JSON.parse(url);
            return {
                name: title || 'Unknown',
                chapters: []
            };
        }
    }

    // For novel html content
    async getHtmlContent(url) {
        throw new Error("getHtmlContent not implemented");
    }

    // Clean html up for reader
    async cleanHtmlContent(html) {
        throw new Error("cleanHtmlContent not implemented");
    }

    getVideoApi(slug, provider, isDub = false) {
        return `https://www.miruro.to/api/sources?episodeId=${slug}&provider=${provider}&fetchType=m3u8&category=${isDub ? 'dub' : 'sub'}&ongoing=false`;
    }

    getHeadersBySource(label) {
        switch (label) {
            case 'ANIMEKAI':
                return {
                    Referer: "https://animekai.to/",
                    Origin: "https://animekai.to"
                };
            case 'ANIMEPAHE':
                return {
                    Referer: "https://animepahe.ru/",
                    Origin: "https://animepahe.ru"
                };
            case 'HIANIME':
                return {
                    Referer: "https://megacloud.club/",
                    Origin: "https://megacloud.club"
                };
            default:
                return {};
        }
    }

    parseAnimeKaiStreams(prefix, playlist, subs) {
        const label = "ANIMEKAI";
        const lines = playlist.trim().split('\n');
        const streams = [];

        try {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                if (line.startsWith('#EXT-X-STREAM-INF')) {
                    const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);
                    const resolution = resolutionMatch ? resolutionMatch[1].split('x')[1] : 'Auto';
                    const url = lines[i + 1].startsWith('https') ? lines[i + 1] : prefix + lines[i + 1].trim();

                    streams.push({
                        url,
                        quality: `${label} - ${resolution}`,
                        originalUrl: url,
                        subtitles: (subs || []).filter((e) => e.kind != "thumbnails").map((sub) => ({
                            file: sub.file,
                            label: sub.label,
                        })),
                        headers: this.getHeadersBySource(label)
                    });
                }
            }
        } catch (error) {
            console.warn('Error parsing AnimeKai streams:', error);
        }

        return streams;
    }

    parseStreamList(data, label) {
        const streams = [];
        const headers = this.getHeadersBySource(label);

        try {
            if (data?.streams && Array.isArray(data.streams)) {
                for (const source of data.streams) {
                    streams.push({
                        url: source.url,
                        quality: `${label} - ${source.height ?? 'Auto'}`,
                        originalUrl: source.url,
                        subtitles: (data.tracks || []).filter((e) => e.kind != "thumbnails").map((sub) => ({
                            file: sub.file,
                            label: sub.label,
                        })),
                        headers: headers
                    });
                }
            }
        } catch (error) {
            console.warn(`Error parsing ${label} streams:`, error);
        }

        return streams;
    }

    // For anime episode video list
    async getVideoList(url) {
        try {
            const { animeKaiEpId, animePaheEpId, zoroEpId } = JSON.parse(url);
            const isDub = this.getPreference('special_#5_pref_audio_type') == 'dub';
            const streams = [];

            const fetchPromises = [];

            if (animeKaiEpId) {
                fetchPromises.push(
                    this.client.get(this.getVideoApi(animeKaiEpId, 'animekai', isDub))
                        .then(resp => ({ provider: 'animekai', data: JSON.parse(resp.body), success: true }))
                        .catch(err => {
                            console.warn('AnimeKai fetch failed:', err);
                            return { provider: 'animekai', success: false };
                        })
                );
            }

            if (animePaheEpId) {
                fetchPromises.push(
                    this.client.get(this.getVideoApi(animePaheEpId, 'animepahe', isDub))
                        .then(resp => ({ provider: 'animepahe', data: JSON.parse(resp.body), success: true }))
                        .catch(err => {
                            console.warn('AnimePahe fetch failed:', err);
                            return { provider: 'animepahe', success: false };
                        })
                );
            }

            if (zoroEpId) {
                fetchPromises.push(
                    this.client.get(this.getVideoApi(zoroEpId, 'zoro', isDub))
                        .then(resp => ({ provider: 'zoro', data: JSON.parse(resp.body), success: true }))
                        .catch(err => {
                            console.warn('Zoro fetch failed:', err);
                            return { provider: 'zoro', success: false };
                        })
                );
            }

            const results = await Promise.all(fetchPromises);

            for (const result of results) {
                if (!result.success) continue;

                try {
                    if (result.provider === 'animekai' && result.data?.streams?.[0]?.url) {
                        const splitResp = await this.client.get(result.data.streams[0].url, this.getHeadersBySource('ANIMEKAI'))
                            .then(resp => resp.body)
                            .catch(err => {
                                console.warn('AnimeKai playlist fetch failed:', err);
                                return null;
                            });

                        if (splitResp) {
                            const domain = (result.data.streams[0].url).match(/^https?:\/\/[^/]+/)?.[0] || '';
                            streams.push(...this.parseAnimeKaiStreams(domain, splitResp, result.data.tracks));
                        }
                    } else if (result.provider === 'animepahe') {
                        streams.push(...this.parseStreamList(result.data, 'ANIMEPAHE'));
                    } else if (result.provider === 'zoro') {
                        streams.push(...this.parseStreamList(result.data, 'HIANIME'));
                    }
                } catch (error) {
                    console.warn(`Error processing ${result.provider} streams:`, error);
                }
            }

            return streams;

        } catch (error) {
            console.error('Error in getVideoList:', error);
            return []; 
        }
    }

    async getPageList(url) {
        throw new Error("getPageList not implemented");
    }

    getFilterList() {
        throw new Error("getFilterList not implemented");
    }

    getSourcePreferences() {
        return [
            {
                key: "special_#5_pref_audio_type",
                listPreference: {
                    title: 'Preferred stream sub/dub type',
                    summary: 'Only select one at a time',
                    valueIndex: 0,
                    entries: ["Sub", "Dub"],
                    entryValues: ["sub", "dub"],
                }
            },
        ];
    }
}