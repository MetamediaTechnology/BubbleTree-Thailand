var bubble = new bubbleTreeAndMap();
$(function() {

    var configNfunc = {
        main: {
            '00': { color: '#24aace', icon: 'svg/00.svg' }
        },
        nfunction: {
            '01': { color: '#556272', icon: 'svg/01.svg' },
            '02': { color: '#82e1aa', icon: 'svg/02.svg' },
            '03': { color: '#2ecd71', icon: 'svg/03.svg' },
            '04': { color: '#ffdd00', icon: 'svg/04.svg' },
            '05': { color: '#754c24', icon: 'svg/05.svg' },
            '06': { color: '#409a66', icon: 'svg/06.svg' },
            '07': { color: '#f17022', icon: 'svg/07.svg' },
            '08': { color: '#333333', icon: 'svg/08.svg' },
            '09': { color: '#fdb813', icon: 'svg/09.svg' },
            '10': { color: '#48535e', icon: 'svg/10.svg' },
        }
    };

    bubble.Create('Nfunc', function(Bubble) {
        bubble.configBubbleTree(Bubble, configNfunc);
    });

    $('#maplegend-title').click(function() {
        $('#maplegend-content').toggle();
    });
});