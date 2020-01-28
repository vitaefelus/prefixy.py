from flask import Flask, jsonify, render_template, url_for, request
import random

app = Flask(__name__)

dictFile = open('slownikUpper.csv')
dictionary = [line.rstrip('\n') for line in dictFile]
prefixes = ['STE', 'NIE', 'PRY', 'ABA', 'ŻĄD', 'URZ', 'PAS', 'SAK', 'OBE',
            'CWA', 'KWA', 'WRÓ', 'WIE', 'HAM', 'CHO', 'CHA', 'MAM', 'DĘB',
            'TĘT', 'JED', 'REK', 'PRO', 'PAR', 'KAR', 'KIE', 'PSI', 'WYG']
game = None
polish_chars = set('ĄĆĘŁŃÓŚŹŻ')


def count_polish_chars(word):
    counter = 0

    for letter in word[3:]:
        for char in polish_chars:
            if letter == char:
                counter += 1
    return counter


class Player:
    '''Klasa definiująca gracza'''

    def __init__(self, name):
        self.name = str(name)
        self.points = 0
        self.passed = False

    def __repr__(self):
        return '%s: %d' % (self.name, self.points)

    def set_name(self, name):
        self.name = name

    def add_points(self, word):
        self.points += len(word[3:]) * 10 + count_polish_chars(word[3:]) * 5

    def has_passed(self):
        if not self.passed:
            return False
        else:
            return True


class PlayerDuo:
    '''Klasa odpowiedzialna za dwójkę graczy i wyznaczanie, kto zaczyna'''

    def __init__(self, first_player, second_player):
        self.tossed = random.randint(0, 1)

        if self.tossed == 0:
            self.starting_player = first_player
            self.following_player = second_player
        else:
            self.starting_player = second_player
            self.following_player = first_player

    def is_starting_player(self, player):
        if self.starting_player == player:
            return True
        else:
            return False


class Hotseat:
    def __init__(self, player_duo):
        self.used_words = []
        self.turn_counter = 0
        self.state = 'not_started'
        self.player_duo = player_duo
        self.prefix = random.choice(prefixes)

    def current_player(self):
        if self.player_duo.following_player.passed:
            return self.player_duo.starting_player

        if self.player_duo.starting_player.passed:
            return self.player_duo.following_player

        if self.turn_counter % 2 == 0:
            return self.player_duo.starting_player
        else:
            return self.player_duo.following_player

    def next_player(self):
        if self.player_duo.following_player.passed:
            return self.player_duo.starting_player

        if self.player_duo.starting_player.passed:
            return self.player_duo.following_player

        if self.turn_counter % 2 == 0:
            return self.player_duo.following_player
        else:
            return self.player_duo.starting_player

    def next_turn(self, input_word):
        json = {}

        if self.player_duo.starting_player.passed is True and self.player_duo.following_player.passed is True:
            self.state = 'ended'
            json = {
                'starting_player': self.player_duo.starting_player.name,
                'starting_player_score': self.player_duo.starting_player.points,
                'following_player': self.player_duo.following_player.name,
                'following_player_score': self.player_duo.following_player.points,
                'current_player': self.current_player().name,
                'next_player': self.next_player().name,
                'turn': self.turn_counter,
                'game_state': self.state
            }
        elif input_word != '' and input_word.isalnum() and input_word in self.used_words:
            json = {
                'result': 'word_used',
                'starting_player': self.player_duo.starting_player.name,
                'starting_player_score': self.player_duo.starting_player.points,
                'following_player': self.player_duo.following_player.name,
                'following_player_score': self.player_duo.following_player.points,
                'current_player': self.current_player().name,
                'next_player': self.next_player().name,
                'turn': self.turn_counter,
                'game_state': self.state
            }
        elif input_word != '' and input_word.isalnum() and input_word in dictionary:

            self.current_player().add_points(input_word)
            self.used_words.append(input_word)

            if self.turn_counter == 9:
                self.state = 'ended'
            json = {
                'result': 'word_valid',
                'starting_player': self.player_duo.starting_player.name,
                'starting_player_score': self.player_duo.starting_player.points,
                'following_player': self.player_duo.following_player.name,
                'following_player_score': self.player_duo.following_player.points,
                'current_player': self.current_player().name,
                'next_player': self.next_player().name,
                'turn': self.turn_counter,
                'word': input_word,
                'game_state': self.state
            }
            self.turn_counter += 1
        elif input_word == '':
            if self.turn_counter % 2 == 0 or self.turn_counter == 0:
                self.player_duo.starting_player.passed = True
            else:
                self.player_duo.following_player.passed = True
            json = {
                'result': 'player_passed',
                'starting_player': self.player_duo.starting_player.name,
                'starting_player_score': self.player_duo.starting_player.points,
                'following_player': self.player_duo.following_player.name,
                'following_player_score': self.player_duo.following_player.points,
                'current_player': self.current_player().name,
                'next_player': self.next_player().name,
                'turn': self.turn_counter,
                'word': input_word,
                'game_state': self.state
            }
        else:
            json = {
                'result': 'word_invalid',
                'starting_player': self.player_duo.starting_player.name,
                'starting_player_score': self.player_duo.starting_player.points,
                'following_player': self.player_duo.following_player.name,
                'following_player_score': self.player_duo.following_player.points,
                'current_player': self.current_player().name,
                'next_player': self.next_player().name,
                'turn': self.turn_counter,
                'game_state': self.state
            }
        return json

    def end_game(self):
        if self.turn_counter == 9:
            return {'result': 'end_game'}


@app.route('/')
def hello_world():
    return render_template('index.html')


@app.route('/hotseat')
def hotseat():
    global game

    player1_name = request.args.get('player1Name', None)
    player2_name = request.args.get('player2Name', None)

    if player1_name == '':
        player1 = Player('Player1')
        player2 = Player(player2_name)
    elif player2_name == '':
        player1 = Player(player1_name)
        player2 = Player('Player2')
    else:
        player1 = Player(player1_name)
        player2 = Player(player2_name)

    player_duo = PlayerDuo(player1, player2)

    game = Hotseat(player_duo)

    return render_template('hotseat.html',
                           player1=game.player_duo.starting_player,
                           player2=game.player_duo.following_player,
                           prefix=game.prefix)


@app.route('/nextturn')
def turn():
    '''ta metoda ma odebrać sygnał o kolejnej turze'''
    global game
    if request.method == 'GET':
        input_word = request.args.get('text', None)
        return game.next_turn(input_word)


@app.route('/pass')
def player_passed():
    '''ta metoda ma odebrać sygnał o tym, że któryś z graczy spasował'''
    global game
    return game.next_turn('')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port='5023')
