#
# PROMPT
#
export PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;31m\]\w\[\033[00m\]\$ '

#
# GLOBALS
#
export LC_ALL=en_US.UTF-8
export SVN_EDITOR=cat

#
# Alias
#
alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'

alias l='ls -lah'
alias vi='vim'

alias phplog='sudo tail -f /var/log/php-fpm/www-error.log'
alias joblog='tail -f /home/ec2-user/log/job.log'
alias my='mysql -u root -px08v67F3WRN4'

#
# VDB
#

# Financeiro
alias vdb_financeiro_compile="cd ~/py-app/vdb && javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres.java"
alias vdb_financeiro_run="cd ~/py-app/vdb && nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres & tail -n 100 -f clone_financeiro.log"
alias vdb_financeiro_kill="pkill -f CloneFinanceiroToPostgres"
alias vdb_financeiro_log="tail -n 100 -f ~/py-app/vdb/clone_financeiro.log"
alias vdb_financeiro_status="pgrep -af CloneFinanceiroToPostgres || echo '❌ CloneFinanceiroToPostgres não está rodando'"

# Contratos
alias vdb_contratos_compile="cd ~/py-app/vdb && javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneContratosToPostgres.java"
alias vdb_contratos_run="cd ~/py-app/vdb && nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneContratosToPostgres & tail -n 100 -f clone_contratos.log"
alias vdb_contratos_kill="pkill -f CloneContratosToPostgres"
alias vdb_contratos_log="tail -n 100 -f ~/py-app/vdb/clone_contratos.log"
alias vdb_contratos_status="pgrep -af CloneContratosToPostgres || echo '❌ CloneContratosToPostgres não está rodando'"

# Tamanhos
alias vdb_sizes_compile="cd ~/py-app/vdb && javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar ListTableSizes.java"
alias vdb_sizes_run="cd ~/py-app/vdb && java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar ListTableSizes"
alias vdb_sizes_log="cat ~/py-app/vdb/tables_financeiro_sizes.txt"
