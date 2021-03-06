function SoundEffect() {
    this.loadSoundEffect = _.memoize(function () {
        return {
            beep: new Howl({
                urls: ['assets/audio/beep.mp3'],
                volume: 0.1
            }),
            fan: new Howl({
                urls: ['assets/audio/fanNoise.mp3'],
                volume: 0.2,
                loop: true
            }),
            slide: new Howl({
                urls: ['assets/audio/slide.mp3'],
                volume: 0.1
            })
        };
    });
}

module.exports = SoundEffect;   