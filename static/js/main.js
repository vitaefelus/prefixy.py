let playerOnePassed = false,
    playerTwoPassed = false;

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
    let value;

    if ( source !== '' ) {
        value = prefix + source.val().trim().toUpperCase();
    } else {
        value = ''
    }

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
    let playerOneScoreContainer = $('#player_one .score');
    let playerTwoScoreContainer = $('#player_two .score');
    let playerOneScore = response.starting_player_score;
    let playerTwoScore = response.following_player_score;

    insertWord.css('background','#FFFFFF');
    errorContainer.html('');

    if ( response.result === 'word_valid' ) {

        if ( response.turn % 2 === 0 || response.turn === 0 ) {
            if ( playerOnePassed ) {
                wordBoxRight.append( '<p>' + response.word + '</p>' );
            } else {
                wordBoxLeft.append( '<p>' + response.word + '</p>' );
            }
        } else {
            if ( playerTwoPassed ) {
                wordBoxLeft.append( '<p>' + response.word + '</p>' );
            } else {
                wordBoxRight.append( '<p>' + response.word + '</p>' );
            }
        }

        insertWord.val('');
        updateScroll();
        playerOneScoreContainer.html( playerOneScore );
        playerTwoScoreContainer.html( playerTwoScore );

    } else if ( response.result === 'word_invalid' ){
        insertWord.css('background','#FF0000');
        errorContainer.html( '<p>Tego słowa nie ma w słowniku!</p>' );

    } else if ( response.result === 'word_used' ) {
        insertWord.css('background','#FF0000');
        errorContainer.html( '<p>Powtórzenie!</p>' );

    } else if ( response.result === 'player_passed' ) {
        if ( playerOnePassed || playerTwoPassed ) {
            let winner = '';
            if( playerOneScore > playerTwoScore ) {
                winner = 'Zwycięzca to:' + response.starting_player + '. Wynik: ' + playerOneScore;
            } else if ( playerOneScore === playerTwoScore ) {
                winner = 'REMIS';
            } else {
                winner = 'Zwycięzca to: ' + response.following_player + '. Wynik: ' + playerTwoScore;
            }

            $('body').html(
                '<h1>Koniec gry! ' + winner + '</h1>'
            )
        } else {
            if ( response.turn % 2 === 0 || response.turn === 0 ) {
                playerOnePassed = true;
                wordBoxLeft.css('background','#DDDDDD');
            } else {
                playerTwoPassed = true;
                wordBoxRight.css('background','#DDDDDD');
            }
        }
    }

    if ( response.game_state === 'ended' ) {
        let winner = '';
        if( playerOneScore > playerTwoScore ) {
            winner = 'Zwycięzca to:' + response.starting_player + '. Wynik: ' + playerOneScore;
        } else if ( playerOneScore === playerTwoScore ) {
            winner = 'REMIS';
        } else {
            winner = 'Zwycięzca to: ' + response.following_player + '. Wynik: ' + playerTwoScore;
        }

        $('body').html(
            '<h1>Koniec gry! ' + winner + '</h1>'
        )
    }
}

$(window).on( 'load', () => {
    let insertWord = $('#insert-word'),
        enter = $('#enter'),
        pass = $('#pass'),
        prefix = $('#prefix').html(  ),
        timer = $('#timer'),
        jump = 95;

    setInterval( function ()    {
        timer.width(jump + '%');
        jump-=5;
    }, 1000 );

    $('body').on( 'keypress', ( e ) => {
        if( e.which == 13 )  // keypress: 'Enter'
            getWordData( insertWord, prefix );
    } );

    enter.on( 'click', (  ) => {
        getWordData( insertWord, prefix );
    } );

    pass.on( 'click', () => {
        handleAjax( 'GET', '/pass', { }, ( data ) => {
            console.log( data );
        } );
        getWordData( '', '' )
    } )

} );