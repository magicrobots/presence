import Service from '@ember/service';

export default Service.extend({
    getIsSafari() {
        return navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
    }
});