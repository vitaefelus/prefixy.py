from flask import Flask, jsonify, render_template, url_for, request
import random

app = Flask(__name__)

dictFile = open('slownikUpper.csv')
dictionary = [line.rstrip('\n') for line in dictFile]
game = None


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

    def add_points(self, word_length):
        self.points += word_length * 10

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

    def current_player(self):
        if self.turn_counter % 2 == 0:
            return self.player_duo.starting_player
        else:
            return self.player_duo.following_player

    def next_player(self):
        self.turn_counter += 1

    def next_turn(self, input_word):
        if input_word in self.used_words:
            
            return {
                'result': 'word_used',
                'current_player': self.current_player().name,
                'turn': self.turn_counter
            }
        elif input_word in dictionary:
            self.next_player()
            self.used_words.append(input_word)
            return {
                'result': 'word_valid',
                'current_player': self.current_player().name,
                'turn': self.turn_counter,
                'word': input_word
            }
        else:
            return {
                'result': 'word_invalid',
                'current_player': self.current_player().name,
                'turn': self.turn_counter
            }

    def end_game(self):
        if self.turn_counter == 60:
            return {'result': 'end_game'}


@app.route('/')
def hello_world():
    return render_template('index.html')


@app.route('/hotseat')
def hotseat():
    global game

    player1_name = request.args.get('player1Name', None)
    player2_name = request.args.get('player2Name', None)

    player1 = Player(player1_name)
    player2 = Player(player2_name)

    player_duo = PlayerDuo(player1, player2)

    game = Hotseat(player_duo)

    return render_template('hotseat.html')


@app.route('/nextturn')
def turn():
    '''ta metoda ma odebrać sygnał o kolejnej turze i odesłać imię aktywnego gracza'''
    global game
    if request.method == 'GET':
        input_word = request.args.get('text', None)
        return game.next_turn(input_word)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port='5023')
