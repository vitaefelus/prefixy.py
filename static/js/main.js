function updateScroll() {
    let element = $('.word-box');
    element.scrollTop = element.scrollHeight;
}

function handleAjax( method, url, data, success ) {
    $.ajax({
        type: method,
        url: url,
        data: data,
        success: success
    });
}

function getWordData( source, prefix ) {
    let value = prefix + source.val().trim().toUpperCase();

    handleAjax( 'GET', '/nextturn', { text: value, }, ( data ) => {
        console.log( data );
        handleWordInsertion( value, data )
    } );
}

function handleWordInsertion( value, response ) {
    let insertWord = $('#insert-word');
    let wordBoxLeft = $('#word-box-left');
    let wordBoxRight = $('#word-box-right');
    let errorContainer = $('#error');
    let playerOneScore = $('#player_one .score');
    let playerTwoScore = $('#player_two .score');

    insertWord.css('background','#FFFFFF');
    errorContainer.html('');

    if ( response.result === 'word_valid' ) {
        if ( response.turn % 2 === 0 || response.turn === 0) {
            wordBoxLeft.append( '<p>' + response.word + '</p>' )
        } else {
            wordBoxRight.append( '<p>' + response.word + '</p>' )
        }

        insertWord.val('');
        updateScroll();
        playerOneScore.html( response.starting_player_score );
        playerTwoScore.html( response.following_player_score )



    } else if ( response.result === 'word_invalid' ){
        insertWord.css('background','#FF0000');
        errorContainer.html( '<p>Tego słowa nie ma w słowniku!</p>' );
    } else {
        insertWord.css('background','#FF0000');
        errorContainer.html( '<p>Powtórzenie!</p>' );
    }
}

$(window).on( 'load', function () {
    let insertWord = $('#insert-word');
    let prefix = $('#prefix').html(  );
    let timer = $('#timer');
    let jump = 95;

    setInterval( function ()    {
        timer.width(jump + '%');
        jump-=5;
    }, 1000 );


    /*handleAjax( 'GET', '/startingturn', { content: 'give_starting_state' }, ( data ) => {
        console.log( data );
        //TO DO: wyślij otrzymane dane do gry i wyświetl to wszystko, w sensie, zeby sie dobrze wyswietlali gracze i slowa wrzucały do odpowiedniego boxa
    } );*/

    $('body').on( 'keypress', function ( e ) {
        let passed = '';
        if( e.which == 13 ) { // keypress: 'Enter'
            getWordData( insertWord, prefix );
       } else if( e.which == 47 ) { // keypress: '/'
            //tu będzie kod do passowania tury
        }
    } );
} );
