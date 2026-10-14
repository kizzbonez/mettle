out=$(env -u PREFIX bash solution.sh data/takes.txt)
assert_eq "$?" "0" "exit status for data/takes.txt"
assert_eq "$out" "Ep 14 Intro.WAV -> ep_14_intro.wav
Ep 14 Interview Ana.wav -> ep_14_interview_ana.wav
Theme v3.FLAC -> theme_v3.flac
notes.TXT -> notes.txt
Ep 14 Mix.final.wav -> ep_14_mix.final.wav
flac: 1
txt: 1
wav: 3" "the new names and the counts printed for data/takes.txt"
