brew services stop mongodb-community

if [[ "$1" -eq "clear" ]];then
    echo "Cleaning db data"
    rm -rf /usr/local/var/mongodb
fi