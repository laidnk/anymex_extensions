const mangayomiSources = [{
    "name": "Anymex Downloader #2",
    "lang": "multi",
    "baseUrl": "https://www.showbox.media/",
    "apiUrl": "",
    "iconUrl": "https://raw.githubusercontent.com/RyanYuuki/AnymeX/main/assets/images/logo.png",
    "typeSource": "multi",
    "itemType": 1,
    "version": "0.0.1",
    "pkgPath": ""
}];

class DefaultExtension extends MProvider {

    constructor() {
        super();
        this.client = new Client();
    }

    async requestBody(url) {
        const resp = await this.client(url);
        var doc = new Document(resp.body);
        return doc;

        // i can only use some stuff when using document like these for example
        // var hasNextPage = body.selectFirst("a.next.page-numbers").text.length > 0 ? true : false;
        // var items = body.select(".switch-block.list-episode-item > li")
    }

    async requestJson(url) {
        const resp = await this.client(url);
        return JSON.parse(resp.body);
    }

    getHeaders(url) {
        throw new Error("getHeaders not implemented");
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
        throw new Error("search not implemented");
    }
    async getDetail(url) {
        throw new Error("getDetail not implemented");
    }
    // For novel html content
    async getHtmlContent(url) {
        throw new Error("getHtmlContent not implemented");
    }
    // Clean html up for reader
    async cleanHtmlContent(html) {
        throw new Error("cleanHtmlContent not implemented");
    }
    // For anime episode video list
    async getVideoList(url) {
        throw new Error("getVideoList not implemented");
    }
    // For manga chapter pages
    async getPageList(url) {
        throw new Error("getPageList not implemented");
    }
    getFilterList() {
        throw new Error("getFilterList not implemented");
    }
    getSourcePreferences() {
        throw new Error("getSourcePreferences not implemented");
    }
}
