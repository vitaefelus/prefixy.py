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
        playerTwoScore.html( response.following_player_score );

        if ( response.game_state === 'ended' ) {
            let winner = '';
            if( response.starting_player_score > response.following_player_score ) {
                winner = 'Zwycięzca to:' + response.starting_player + '. Wynik: ' + response.starting_player_score;
            } else if ( response.starting_player_score === response.following_player_score ) {
                winner = 'REMIS';
            } else {
                winner = 'Zwycięzca to: ' + response.following_player + '. Wynik: ' + response.following_player_score;
            }

            $('body').html(
                '<h1>Koniec gry! ' + winner + '</h1>'
            )
        }

    } else if ( response.result === 'word_invalid' ){
        insertWord.css('background','#FF0000');
        errorContainer.html( '<p>Tego słowa nie ma w słowniku!</p>' );
    } else if (response.result === 'word_used') {
        insertWord.css('background','#FF0000');
        errorContainer.html( '<p>Powtórzenie!</p>' );
    }
}

$(window).on( 'load', () => {
    let insertWord = $('#insert-word');
    let enter = $('#enter');
    let pass = $('#pass');
    let prefix = $('#prefix').html(  );
    let timer = $('#timer');
    let jump = 95;

    setInterval( function ()    {
        timer.width(jump + '%');
        jump-=5;
    }, 1000 );

    $('body').on( 'keypress', ( e ) => {
        if( e.which == 13 )  // keypress: 'Enter'
            getWordData( insertWord, prefix );
    } );

    enter.on('click', (  ) => {
        getWordData( insertWord, prefix );
    })

} );
