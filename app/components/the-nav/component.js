import Component from '@ember/component';

export default Component.extend({
    classNames: ['nav--left'],

    navButtons: Object.freeze([
        {title: 'abooot', route: 'about'},
        {title: 'images', route: 'images'},
        {title: 'help', route: 'help'},
        {title: 'search', route: null}
    ])
});
